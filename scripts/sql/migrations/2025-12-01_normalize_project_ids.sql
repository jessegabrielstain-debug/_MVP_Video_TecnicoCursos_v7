-- ============================================
-- 2025-12-01 - Normalizar project_id para UUID
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Remover políticas existentes nas tabelas afetadas para permitir alterações de tipo
DO $$
DECLARE
    rec record;
    target_tables text[] := ARRAY[
        'projects','slides','render_jobs','project_versions','project_comments',
        'project_analytics','project_collaborators','files','webhooks','comments',
        'compliance_reports','ai_analysis_results','uploads'
    ];
BEGIN
    FOR rec IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = ANY (target_tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
    END LOOP;
END $$;

-- Remover FKs antigos que apontam para projects.id para permitir alteração de tipo
DO $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT conrelid::regclass AS table_name, conname
        FROM pg_constraint
        WHERE confrelid = 'public.projects'::regclass
          AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', rec.table_name, rec.conname);
    END LOOP;
END $$;

-- Garantir que projects.id use UUID com PK válido
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projects'
          AND column_name = 'id'
          AND data_type <> 'uuid'
    ) THEN
        EXECUTE 'ALTER TABLE public.projects ALTER COLUMN id TYPE uuid USING id::uuid';
    END IF;

    EXECUTE 'ALTER TABLE public.projects ALTER COLUMN id SET DEFAULT uuid_generate_v4()';
    EXECUTE 'ALTER TABLE public.projects ALTER COLUMN id SET NOT NULL';
    EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_pkey';
    EXECUTE 'ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id)';
END $$;

-- Normalizar colunas project_id dependentes e recriar FKs
DO $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT * FROM (
            VALUES
                ('ai_analysis_results', 'project_id', 'CASCADE'),
                ('comments', 'project_id', 'CASCADE'),
                ('compliance_reports', 'project_id', 'CASCADE'),
                ('files', 'project_id', 'CASCADE'),
                ('project_analytics', 'project_id', 'CASCADE'),
                ('project_collaborators', 'project_id', 'CASCADE'),
                ('project_comments', 'project_id', 'CASCADE'),
                ('project_versions', 'project_id', 'CASCADE'),
                ('render_jobs', 'project_id', 'CASCADE'),
                ('slides', 'project_id', 'CASCADE'),
                ('uploads', 'project_id', 'CASCADE'),
                ('webhooks', 'project_id', 'CASCADE')
        ) AS t(table_name, column_name, on_delete)
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = rec.table_name
              AND column_name = rec.column_name
        ) THEN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = rec.table_name
                  AND column_name = rec.column_name
                  AND data_type <> 'uuid'
            ) THEN
                EXECUTE format(
                    'ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING %I::uuid',
                    rec.table_name,
                    rec.column_name,
                    rec.column_name
                );
            END IF;

            EXECUTE format(
                'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
                rec.table_name,
                rec.table_name || '_' || rec.column_name || '_fkey'
            );

            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.projects(id) ON DELETE %s',
                rec.table_name,
                rec.table_name || '_' || rec.column_name || '_fkey',
                rec.column_name,
                rec.on_delete
            );
        END IF;
    END LOOP;
END $$;
