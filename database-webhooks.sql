-- ============================================
-- TABELA: webhooks
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_delivery_at TIMESTAMPTZ,
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    retry_interval INTEGER DEFAULT 60
);

-- ============================================
-- TABELA: webhook_deliveries
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed'
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    response_code INTEGER,
    response_body TEXT,
    response_time INTEGER,
    attempts INTEGER DEFAULT 0,
    error TEXT,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);

-- ============================================
-- TRIGGERS DE UPDATE
-- ============================================
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_deliveries_updated_at ON public.webhook_deliveries;
CREATE TRIGGER update_webhook_deliveries_updated_at BEFORE UPDATE ON public.webhook_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
