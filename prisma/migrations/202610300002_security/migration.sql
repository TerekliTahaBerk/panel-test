BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
CREATE SCHEMA security AUTHORIZATION panel_migrator;
REVOKE ALL ON SCHEMA security FROM PUBLIC;
GRANT USAGE ON SCHEMA public, security TO panel_runtime, panel_provision_owner;
GRANT USAGE ON SCHEMA security TO panel_provisioner;
CREATE FUNCTION security.setting(key text) RETURNS text LANGUAGE sql STABLE
SET search_path = pg_catalog AS $$ SELECT nullif(pg_catalog.current_setting(key, true), '') $$;
REVOKE ALL ON FUNCTION security.setting(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION security.setting(text) TO panel_runtime, panel_provision_owner;

ALTER TABLE public."User" ADD CONSTRAINT user_fields CHECK (
 "authVersion">0 AND ("emailNormalized" IS NULL OR ("emailNormalized"=lower(btrim("emailNormalized")) AND length("emailNormalized") BETWEEN 3 AND 254))
 AND ("displayName" IS NULL OR length("displayName") BETWEEN 1 AND 160));
ALTER TABLE public."Organization" ADD CONSTRAINT organization_fields CHECK (
 slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' AND length(name) BETWEEN 1 AND 160 AND name=btrim(name)
 AND "provisioningKeyHash" ~ '^[a-f0-9]{64}$' AND "provisioningRequestHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE public."OrganizationMembership" ADD CONSTRAINT membership_version CHECK (version>0);
ALTER TABLE public."Branch" ADD CONSTRAINT branch_fields CHECK (length(code) BETWEEN 1 AND 40 AND length(name) BETWEEN 1 AND 160);
ALTER TABLE public."AuditLog" ADD CONSTRAINT audit_fields CHECK (
 ("actorMembershipId" IS NULL OR "actorUserId" IS NOT NULL)
 AND ("actorType" <> 'USER' OR "actorUserId" IS NOT NULL)
 AND length(action) BETWEEN 1 AND 120 AND length("entityType") BETWEEN 1 AND 80
 AND (metadata IS NULL OR (jsonb_typeof(metadata)='object' AND octet_length(metadata::text)<=8192)));

CREATE FUNCTION security.immutable_keys() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_TABLE_NAME='Organization' THEN
  IF (NEW.id,NEW."createdByUserId",NEW."provisioningKeyHash",NEW."provisioningRequestHash") IS DISTINCT FROM
     (OLD.id,OLD."createdByUserId",OLD."provisioningKeyHash",OLD."provisioningRequestHash") THEN
   RAISE EXCEPTION 'Immutable receipt' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='RoleAssignment' OR TG_TABLE_NAME='BranchMembership' THEN
  RAISE EXCEPTION 'Immutable grant' USING ERRCODE='23514';
 ELSIF (NEW."organizationId",NEW.id) IS DISTINCT FROM (OLD."organizationId",OLD.id) THEN
  RAISE EXCEPTION 'Immutable tenant' USING ERRCODE='23514';
 END IF;
 IF TG_TABLE_NAME='OrganizationMembership' THEN
  IF NEW."userId" IS DISTINCT FROM OLD."userId" THEN RAISE EXCEPTION 'Immutable identity' USING ERRCODE='23514'; END IF;
  IF (NEW.status,NEW."accessScope") IS DISTINCT FROM (OLD.status,OLD."accessScope") THEN NEW.version := OLD.version+1; END IF;
 END IF;
 RETURN NEW;
END $$;

-- Tablo sahibi yalnız kısıt denetiminde tüm satırları görür; web bağlantısı bu rolü kullanmaz.
CREATE FUNCTION security.valid_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE oid uuid; o public."Organization"%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='Organization' THEN oid:=NEW.id; ELSE oid:=NEW."organizationId"; END IF;
 SELECT * INTO o FROM public."Organization" WHERE id=oid FOR UPDATE;
 IF o.status='ACTIVE' AND (o."ownerMembershipId" IS NULL OR NOT EXISTS (
  SELECT 1 FROM public."OrganizationMembership" m WHERE m."organizationId"=oid AND m.id=o."ownerMembershipId"
   AND m.status='ACTIVE' AND m."accessScope"='ORGANIZATION')) THEN
  RAISE EXCEPTION 'Invalid organization owner' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION security.valid_owner(), security.immutable_keys() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER organization_owner_valid AFTER INSERT OR UPDATE ON public."Organization"
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION security.valid_owner();
CREATE CONSTRAINT TRIGGER membership_owner_valid AFTER INSERT OR UPDATE ON public."OrganizationMembership"
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION security.valid_owner();
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."Organization" TO panel_migrator USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_keys BEFORE UPDATE ON public."Organization" FOR EACH ROW EXECUTE FUNCTION security.immutable_keys();
CREATE POLICY tenant_scope ON public."Organization" TO panel_runtime
 USING ("id"::text=(SELECT security.setting('app.organization_id')))
 WITH CHECK ("id"::text=(SELECT security.setting('app.organization_id')));
ALTER TABLE public."OrganizationMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrganizationMembership" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."OrganizationMembership" TO panel_migrator USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_keys BEFORE UPDATE ON public."OrganizationMembership" FOR EACH ROW EXECUTE FUNCTION security.immutable_keys();
CREATE POLICY tenant_scope ON public."OrganizationMembership" TO panel_runtime
 USING ("organizationId"::text=(SELECT security.setting('app.organization_id')))
 WITH CHECK ("organizationId"::text=(SELECT security.setting('app.organization_id')));
ALTER TABLE public."RoleAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RoleAssignment" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."RoleAssignment" TO panel_migrator USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_keys BEFORE UPDATE ON public."RoleAssignment" FOR EACH ROW EXECUTE FUNCTION security.immutable_keys();
CREATE POLICY tenant_scope ON public."RoleAssignment" TO panel_runtime
 USING ("organizationId"::text=(SELECT security.setting('app.organization_id')))
 WITH CHECK ("organizationId"::text=(SELECT security.setting('app.organization_id')));
ALTER TABLE public."Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Branch" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."Branch" TO panel_migrator USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_keys BEFORE UPDATE ON public."Branch" FOR EACH ROW EXECUTE FUNCTION security.immutable_keys();
CREATE POLICY tenant_scope ON public."Branch" TO panel_runtime
 USING ("organizationId"::text=(SELECT security.setting('app.organization_id')))
 WITH CHECK ("organizationId"::text=(SELECT security.setting('app.organization_id')));
ALTER TABLE public."BranchMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BranchMembership" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."BranchMembership" TO panel_migrator USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_keys BEFORE UPDATE ON public."BranchMembership" FOR EACH ROW EXECUTE FUNCTION security.immutable_keys();
CREATE POLICY tenant_scope ON public."BranchMembership" TO panel_runtime
 USING ("organizationId"::text=(SELECT security.setting('app.organization_id')))
 WITH CHECK ("organizationId"::text=(SELECT security.setting('app.organization_id')));
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."AuditLog" TO panel_migrator USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_keys BEFORE UPDATE ON public."AuditLog" FOR EACH ROW EXECUTE FUNCTION security.immutable_keys();
CREATE POLICY tenant_scope ON public."AuditLog" TO panel_runtime
 USING ("organizationId"::text=(SELECT security.setting('app.organization_id')))
 WITH CHECK ("organizationId"::text=(SELECT security.setting('app.organization_id')));
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_inspection ON public."User" TO panel_migrator USING(true) WITH CHECK(true);
CREATE POLICY own_identity ON public."User" FOR SELECT TO panel_runtime USING (id::text=(SELECT security.setting('app.actor_id')));
CREATE POLICY own_memberships ON public."OrganizationMembership" FOR SELECT TO panel_runtime
 USING ((SELECT security.setting('app.organization_id')) IS NULL AND "userId"::text=(SELECT security.setting('app.actor_id')));
CREATE POLICY own_organizations ON public."Organization" FOR SELECT TO panel_runtime USING (
 (SELECT security.setting('app.organization_id')) IS NULL AND EXISTS(SELECT 1 FROM public."OrganizationMembership" m WHERE m."organizationId"="Organization".id
  AND m."userId"::text=(SELECT security.setting('app.actor_id'))));
GRANT SELECT ON public."User" TO panel_runtime;
-- Makbuz alanları runtime SELECT kapsamına girmez; Prisma sorguları açık select kullanır.
GRANT SELECT (id,slug,name,type,status,"ownerMembershipId","createdAt","updatedAt") ON public."Organization" TO panel_runtime;
GRANT SELECT ON public."OrganizationMembership",public."RoleAssignment",public."Branch",public."BranchMembership",public."AuditLog" TO panel_runtime;
GRANT UPDATE (name,status,"ownerMembershipId","updatedAt") ON public."Organization" TO panel_runtime;
GRANT INSERT ON public."OrganizationMembership",public."Branch",public."RoleAssignment",public."BranchMembership",public."AuditLog" TO panel_runtime;
GRANT UPDATE (status,"accessScope",version,"updatedAt") ON public."OrganizationMembership" TO panel_runtime;
GRANT UPDATE (name,code,status,"updatedAt") ON public."Branch" TO panel_runtime;
GRANT DELETE ON public."RoleAssignment",public."BranchMembership",public."Branch" TO panel_runtime;
-- Yetki değişimi üyelik satırını kilitler ve sürümü artırır; eski context reddedilir.
CREATE FUNCTION security.grant_version() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  UPDATE public."OrganizationMembership" SET version=version+1 WHERE "organizationId"=OLD."organizationId" AND id=OLD."membershipId";
  RETURN OLD;
 END IF;
 UPDATE public."OrganizationMembership" SET version=version+1 WHERE "organizationId"=NEW."organizationId" AND id=NEW."membershipId";
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION security.grant_version() FROM PUBLIC;
CREATE TRIGGER role_version AFTER INSERT OR DELETE ON public."RoleAssignment" FOR EACH ROW EXECUTE FUNCTION security.grant_version();
CREATE TRIGGER branch_version AFTER INSERT OR DELETE ON public."BranchMembership" FOR EACH ROW EXECUTE FUNCTION security.grant_version();
COMMIT;
