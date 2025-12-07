-- Renomeia coluna "index" para "order_index" somente se ela existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'slides'
          AND column_name = 'index'
    ) THEN
        ALTER TABLE public.slides RENAME COLUMN "index" TO order_index;
    END IF;
END $$;