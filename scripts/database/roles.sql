-- Yalnız izole geliştirme/CI bootstrap yöneticisi çalıştırır. Parolalar burada tutulmaz.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='panel_migrator') THEN CREATE ROLE panel_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='panel_runtime') THEN CREATE ROLE panel_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='panel_provisioner') THEN CREATE ROLE panel_provisioner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='panel_provision_owner') THEN CREATE ROLE panel_provision_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO panel_migrator;
-- Sadece migrator fonksiyon sahipliğini kurabilir; istek rolleri üye değildir.
GRANT panel_provision_owner TO panel_migrator WITH INHERIT FALSE, SET TRUE;
