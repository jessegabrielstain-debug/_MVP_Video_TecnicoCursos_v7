# Supabase Dashboard - Queries Essenciais

## 📊 Visão Geral

Queries SQL úteis para monitoramento e análise via Supabase Dashboard (SQL Editor).

---

## 👥 User Activity

### Usuários Ativos (Últimas 24h)
```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(DISTINCT ae.id) as events_count,
  MAX(ae.created_at) as last_activity,
  ARRAY_AGG(DISTINCT ae.event_type) as event_types
FROM auth.users u
LEFT JOIN analytics_events ae ON ae.user_id = u.id::text
WHERE ae.created_at > NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.email, u.full_name
ORDER BY events_count DESC
LIMIT 50;
```

### Novos Cadastros (Última Semana)
```sql
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;
```

### Usuários por Role
```sql
SELECT 
  r.name as role,
  COUNT(DISTINCT ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON ur.role_id = r.id
GROUP BY r.name
ORDER BY user_count DESC;
```

---

## 🎬 Render Jobs Stats

### Jobs por Status (Últimas 24h)
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(progress)::numeric, 2) as avg_progress,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::numeric, 2) as avg_duration_sec
FROM render_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;
```

### Taxa de Sucesso por Hora
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'completed')::decimal / COUNT(*)) * 100,
    2
  ) as success_rate
FROM render_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

### Jobs Mais Lentos (Top 20)
```sql
SELECT 
  id,
  project_id,
  user_id,
  status,
  EXTRACT(EPOCH FROM (
    COALESCE(completed_at, NOW()) - created_at
  )) as duration_seconds,
  error_message
FROM render_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND status IN ('completed', 'failed')
ORDER BY duration_seconds DESC
LIMIT 20;
```

### Jobs Travados (Stuck)
```sql
SELECT 
  id,
  project_id,
  user_id,
  status,
  progress,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as stuck_seconds
FROM render_jobs
WHERE status IN ('processing', 'queued')
  AND updated_at < NOW() - INTERVAL '30 minutes'
ORDER BY stuck_seconds DESC;
```

---

## 📈 Analytics Events

### Top Eventos (Última Semana)
```sql
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC
LIMIT 20;
```

### Funil de Conversão (Upload → Render)
```sql
WITH funnel AS (
  SELECT 
    user_id,
    MAX(CASE WHEN event_type = 'pptx_uploaded' THEN 1 ELSE 0 END) as uploaded,
    MAX(CASE WHEN event_type = 'render_started' THEN 1 ELSE 0 END) as started,
    MAX(CASE WHEN event_type = 'render_completed' THEN 1 ELSE 0 END) as completed
  FROM analytics_events
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY user_id
)
SELECT 
  SUM(uploaded) as users_uploaded,
  SUM(started) as users_started_render,
  SUM(completed) as users_completed_render,
  ROUND((SUM(started)::decimal / NULLIF(SUM(uploaded), 0)) * 100, 2) as upload_to_render_rate,
  ROUND((SUM(completed)::decimal / NULLIF(SUM(started), 0)) * 100, 2) as render_success_rate
FROM funnel;
```

---

## 🚨 Error Monitoring

### Top Erros (Última Semana)
```sql
SELECT 
  SUBSTRING(error_message, 1, 100) as error_prefix,
  COUNT(*) as occurrences,
  COUNT(DISTINCT user_id) as affected_users,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM render_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_prefix
ORDER BY occurrences DESC
LIMIT 20;
```

### Erros por Usuário
```sql
SELECT 
  u.email,
  COUNT(*) as failed_jobs,
  ARRAY_AGG(DISTINCT SUBSTRING(rj.error_message, 1, 50)) as error_types
FROM render_jobs rj
JOIN auth.users u ON u.id::text = rj.user_id
WHERE rj.status = 'failed'
  AND rj.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.email
HAVING COUNT(*) > 3
ORDER BY failed_jobs DESC;
```

---

## 📦 Projects & Content

### Projetos por Status
```sql
SELECT 
  status,
  COUNT(*) as project_count,
  ROUND(AVG(total_slides)::numeric, 2) as avg_slides
FROM projects
GROUP BY status
ORDER BY project_count DESC;
```

### Top Projetos por Slides
```sql
SELECT 
  p.id,
  p.name,
  u.email as owner,
  p.total_slides,
  p.status,
  p.created_at
FROM projects p
JOIN auth.users u ON u.id::text = p.user_id
ORDER BY p.total_slides DESC
LIMIT 20;
```

### Cursos Mais Acessados (NR Courses)
```sql
SELECT 
  title,
  description,
  modules_count,
  (metadata->>'views')::int as views,
  created_at
FROM nr_courses
WHERE is_active = true
ORDER BY (metadata->>'views')::int DESC NULLS LAST
LIMIT 20;
```

---

## 🔐 Security & RBAC

### Permissões por Usuário
```sql
SELECT 
  u.email,
  r.name as role,
  ARRAY_AGG(p.name) as permissions
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id::text
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
GROUP BY u.email, r.name
ORDER BY u.email;
```

### Audit Log (Últimas 100 Ações Admin)
```sql
SELECT 
  ae.created_at,
  u.email as user,
  ae.event_type,
  ae.metadata->>'target' as target,
  ae.metadata->>'action' as action
FROM analytics_events ae
JOIN auth.users u ON u.id::text = ae.user_id
WHERE ae.category = 'admin'
  AND ae.created_at > NOW() - INTERVAL '30 days'
ORDER BY ae.created_at DESC
LIMIT 100;
```

---

## 🗄️ Storage Usage

### Storage por Bucket
```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb
FROM storage.objects
GROUP BY bucket_id
ORDER BY total_mb DESC;
```

### Top Arquivos por Tamanho
```sql
SELECT 
  name,
  bucket_id,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  created_at,
  owner
FROM storage.objects
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 50;
```

---

## 🔧 Performance & Health

### Conexões Ativas
```sql
SELECT 
  COUNT(*) as active_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_queries,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = current_database();
```

### Tamanho das Tabelas
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### Índices Não Utilizados
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 📅 Time Series Analysis

### Crescimento de Usuários (Mensal)
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative_users
FROM auth.users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Renders por Dia da Semana
```sql
SELECT 
  TO_CHAR(created_at, 'Day') as day_of_week,
  COUNT(*) as render_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)))::numeric, 2) as avg_duration_sec
FROM render_jobs
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);
```

---

## 🎯 Business Metrics

### Retenção de Usuários (Cohort)
```sql
WITH first_activity AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', MIN(created_at)) as cohort_week
  FROM analytics_events
  GROUP BY user_id
)
SELECT 
  fa.cohort_week,
  COUNT(DISTINCT fa.user_id) as cohort_size,
  COUNT(DISTINCT CASE 
    WHEN ae.created_at >= fa.cohort_week + INTERVAL '1 week' 
    THEN ae.user_id 
  END) as retained_week_1,
  ROUND(
    COUNT(DISTINCT CASE WHEN ae.created_at >= fa.cohort_week + INTERVAL '1 week' THEN ae.user_id END)::decimal 
    / COUNT(DISTINCT fa.user_id) * 100,
    2
  ) as retention_rate_week_1
FROM first_activity fa
LEFT JOIN analytics_events ae ON ae.user_id = fa.user_id
GROUP BY fa.cohort_week
ORDER BY fa.cohort_week DESC
LIMIT 12;
```

### Churn Rate (Inatividade >30 dias)
```sql
WITH last_activities AS (
  SELECT 
    user_id,
    MAX(created_at) as last_seen
  FROM analytics_events
  GROUP BY user_id
)
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '30 days') as active_users,
  COUNT(*) FILTER (WHERE last_seen <= NOW() - INTERVAL '30 days') as churned_users,
  ROUND(
    COUNT(*) FILTER (WHERE last_seen <= NOW() - INTERVAL '30 days')::decimal / COUNT(*) * 100,
    2
  ) as churn_rate
FROM last_activities;
```

---

_Última atualização: 2025-11-17_  
_Execute queries no Supabase Dashboard > SQL Editor_
