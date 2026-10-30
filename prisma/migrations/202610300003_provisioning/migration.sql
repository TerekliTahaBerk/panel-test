BEGIN;
-- Faz 05 ürün kararı sağlanana kadar kapalı. Test harness'i yalnız izole DB'de değiştirir.
CREATE FUNCTION security.provisioning_quota() RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$ SELECT 0 $$;
REVOKE ALL ON FUNCTION security.provisioning_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION security.provisioning_quota() TO panel_provision_owner;
GRANT SELECT (id,status,"authVersion") ON public."User" TO panel_provision_owner;
CREATE POLICY provisioning_user ON public."User" FOR SELECT TO panel_provision_owner
 USING (id::text=(SELECT security.setting('provision.actor')));
GRANT SELECT, INSERT ON public."Organization" TO panel_provision_owner;
GRANT UPDATE ("ownerMembershipId",status) ON public."Organization" TO panel_provision_owner;
GRANT SELECT, INSERT ON public."OrganizationMembership" TO panel_provision_owner;
GRANT INSERT ON public."AuditLog" TO panel_provision_owner;
CREATE POLICY provisioning_read ON public."Organization" FOR SELECT TO panel_provision_owner USING (
 "createdByUserId"::text=(SELECT security.setting('provision.actor')) AND
 ("provisioningKeyHash"=(SELECT security.setting('provision.key')) OR (SELECT security.setting('provision.phase'))='QUOTA'));
CREATE POLICY provisioning_insert ON public."Organization" FOR INSERT TO panel_provision_owner WITH CHECK (
 id::text=(SELECT security.setting('provision.new_id')) AND "createdByUserId"::text=(SELECT security.setting('provision.actor'))
 AND "provisioningKeyHash"=(SELECT security.setting('provision.key')) AND status='DRAFT' AND "ownerMembershipId" IS NULL);
CREATE POLICY provisioning_activate ON public."Organization" FOR UPDATE TO panel_provision_owner USING (
 id::text=(SELECT security.setting('provision.new_id')) AND "createdByUserId"::text=(SELECT security.setting('provision.actor'))
 AND "provisioningKeyHash"=(SELECT security.setting('provision.key')) AND status='DRAFT') WITH CHECK (
 id::text=(SELECT security.setting('provision.new_id')) AND "createdByUserId"::text=(SELECT security.setting('provision.actor'))
 AND "provisioningKeyHash"=(SELECT security.setting('provision.key')) AND status='ACTIVE'
 AND "ownerMembershipId"::text=(SELECT security.setting('provision.membership')));
CREATE POLICY provisioning_member_read ON public."OrganizationMembership" FOR SELECT TO panel_provision_owner USING (
 "organizationId"::text=(SELECT security.setting('provision.result_id')) AND "userId"::text=(SELECT security.setting('provision.actor')));
CREATE POLICY provisioning_member_insert ON public."OrganizationMembership" FOR INSERT TO panel_provision_owner WITH CHECK (
 "organizationId"::text=(SELECT security.setting('provision.new_id')) AND "userId"::text=(SELECT security.setting('provision.actor'))
 AND id::text=(SELECT security.setting('provision.membership')) AND status='ACTIVE' AND "accessScope"='ORGANIZATION');
CREATE POLICY provisioning_audit ON public."AuditLog" FOR INSERT TO panel_provision_owner WITH CHECK (
 "organizationId"::text=(SELECT security.setting('provision.new_id')) AND "actorUserId"::text=(SELECT security.setting('provision.actor'))
 AND "actorMembershipId"::text=(SELECT security.setting('provision.membership')) AND action='organization.provisioned' AND "actorType"='USER');

CREATE FUNCTION security.create_organization(
 p_actor uuid, p_auth_version integer, p_step_up timestamptz, p_expires timestamptz,
 p_name text, p_slug text, p_type text, p_key uuid, p_request uuid
) RETURNS TABLE ("organizationId" uuid,"ownerMembershipId" uuid,slug text,replayed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE kh text; rh text; existing public."Organization"%ROWTYPE; mid uuid; oid uuid; total integer;
BEGIN
 -- Caller'ın oturum/transaction ayarlarını güvenilir kabul etme.
 PERFORM pg_catalog.set_config('app.organization_id','',true);
 PERFORM pg_catalog.set_config('provision.actor','',true);
 PERFORM pg_catalog.set_config('provision.key','',true);
 PERFORM pg_catalog.set_config('provision.phase','',true);
 PERFORM pg_catalog.set_config('provision.new_id','',true);
 PERFORM pg_catalog.set_config('provision.result_id','',true);
 PERFORM pg_catalog.set_config('provision.membership','',true);
 IF p_actor IS NULL OR p_auth_version IS NULL OR p_step_up IS NULL OR p_expires IS NULL OR p_key IS NULL OR p_request IS NULL
  OR p_step_up < pg_catalog.statement_timestamp()-interval '15 minutes' OR p_step_up > pg_catalog.statement_timestamp()
  OR p_expires <= pg_catalog.statement_timestamp() THEN RAISE EXCEPTION 'Unavailable' USING ERRCODE='42501'; END IF;
 IF p_name IS NULL OR p_slug IS NULL OR p_type IS NULL OR p_name<>btrim(p_name) OR length(p_name) NOT BETWEEN 1 AND 160
  OR p_slug !~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' OR p_type NOT IN ('INDIVIDUAL','CENTER','SCHOOL') THEN
  RAISE EXCEPTION 'Invalid input' USING ERRCODE='22023'; END IF;
 kh:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_key::text,'UTF8')),'hex');
 rh:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(1,p_name,p_slug,p_type)::text,'UTF8')),'hex');
 PERFORM pg_catalog.set_config('provision.actor',p_actor::text,true);
 PERFORM pg_catalog.set_config('provision.key',kh,true);
 IF NOT EXISTS(SELECT 1 FROM public."User" u WHERE u.id=p_actor AND u.status='ACTIVE' AND u."authVersion"=p_auth_version) THEN
  RAISE EXCEPTION 'Unavailable' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,0));
 SELECT o.* INTO existing FROM public."Organization" o WHERE o."createdByUserId"=p_actor AND o."provisioningKeyHash"=kh;
 IF FOUND THEN
  IF existing."provisioningRequestHash"<>rh THEN RAISE EXCEPTION 'Conflict' USING ERRCODE='23505'; END IF;
  PERFORM pg_catalog.set_config('provision.result_id',existing.id::text,true);
  SELECT m.id INTO mid FROM public."OrganizationMembership" m WHERE m."organizationId"=existing.id AND m."userId"=p_actor AND m.status='ACTIVE';
  IF existing.status<>'ACTIVE' OR mid IS NULL THEN RAISE EXCEPTION 'Unavailable' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT existing.id,mid,existing.slug,true;
  RETURN;
 END IF;
 PERFORM pg_catalog.set_config('provision.phase','QUOTA',true);
 SELECT count(*) INTO total FROM public."Organization" o WHERE o."createdByUserId"=p_actor;
 PERFORM pg_catalog.set_config('provision.phase','',true);
 IF total>=security.provisioning_quota() THEN RAISE EXCEPTION 'Creation disabled or quota exceeded' USING ERRCODE='42501'; END IF;
 oid:=pg_catalog.gen_random_uuid(); mid:=pg_catalog.gen_random_uuid();
 PERFORM pg_catalog.set_config('provision.new_id',oid::text,true);
 PERFORM pg_catalog.set_config('provision.result_id',oid::text,true);
 PERFORM pg_catalog.set_config('provision.membership',mid::text,true);
 INSERT INTO public."Organization"(id,slug,name,type,status,"createdByUserId","provisioningKeyHash","provisioningRequestHash","updatedAt")
 VALUES(oid,p_slug,p_name,p_type::public."OrganizationType",'DRAFT',p_actor,kh,rh,pg_catalog.statement_timestamp());
 INSERT INTO public."OrganizationMembership"(id,"organizationId","userId",status,"accessScope","updatedAt")
 VALUES(mid,oid,p_actor,'ACTIVE','ORGANIZATION',pg_catalog.statement_timestamp());
 UPDATE public."Organization" SET "ownerMembershipId"=mid,status='ACTIVE' WHERE id=oid;
 INSERT INTO public."AuditLog"(id,"organizationId","actorUserId","actorMembershipId","actorType","entityType","entityId",action,"requestId",metadata,"idempotencyKey")
 VALUES(pg_catalog.gen_random_uuid(),oid,p_actor,mid,'USER','Organization',oid,'organization.provisioned',p_request,
 pg_catalog.jsonb_build_object('version',1,'assurance','AAL2','stepUpAt',p_step_up,'keyHash',kh),kh);
 -- Deferred kontroller fonksiyon dönüşünde değil, COMMIT sırasında da zorunludur.
 RETURN QUERY SELECT oid,mid,p_slug,false;
END $$;
REVOKE ALL ON FUNCTION security.create_organization(uuid,integer,timestamptz,timestamptz,text,text,text,uuid,uuid) FROM PUBLIC, panel_runtime;
-- Yeni sahibin schema CREATE yetkisi yalnız sahiplik devri sırasında gerekir.
GRANT CREATE ON SCHEMA security TO panel_provision_owner;
ALTER FUNCTION security.create_organization(uuid,integer,timestamptz,timestamptz,text,text,text,uuid,uuid) OWNER TO panel_provision_owner;
REVOKE CREATE ON SCHEMA security FROM panel_provision_owner;
SET LOCAL ROLE panel_provision_owner;
GRANT EXECUTE ON FUNCTION security.create_organization(uuid,integer,timestamptz,timestamptz,text,text,text,uuid,uuid) TO panel_provisioner;
RESET ROLE;
COMMIT;
