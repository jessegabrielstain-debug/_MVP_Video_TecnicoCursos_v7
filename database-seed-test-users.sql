-- Seed: Criar Usuários de Teste para RBAC
-- Executar manualmente no Supabase Dashboard > SQL Editor
-- IMPORTANTE: Trocar emails por emails reais que você tenha acesso

-- ============================================
-- PARTE 1: Criar usuários via auth.users
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuário Admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'admin@mvpvideo.test',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Test","role":"admin"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Usuário Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'editor@mvpvideo.test',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Editor Test","role":"editor"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Usuário Viewer
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'viewer@mvpvideo.test',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Viewer Test","role":"viewer"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Usuário Moderator
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'moderator@mvpvideo.test',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Moderator Test","role":"moderator"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- PARTE 2: Atribuir Roles aos Usuários
-- ============================================

-- Admin
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'admin@mvpvideo.test'
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Editor
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'editor@mvpvideo.test'
  AND r.name = 'editor'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Viewer
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'viewer@mvpvideo.test'
  AND r.name = 'viewer'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Moderator
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'moderator@mvpvideo.test'
  AND r.name = 'moderator'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================
-- PARTE 3: Verificar Criação
-- ============================================

-- Listar usuários criados
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
WHERE u.email LIKE '%@mvpvideo.test'
ORDER BY u.email;

-- Listar roles atribuídas
SELECT 
  u.email,
  r.name as role,
  ARRAY_AGG(p.name) as permissions
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id::text
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.email LIKE '%@mvpvideo.test'
GROUP BY u.email, r.name
ORDER BY u.email;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
1. Copie todo este arquivo
2. Acesse Supabase Dashboard > SQL Editor
3. Cole e execute o SQL
4. Verifique os resultados com os SELECTs finais
5. Use as credenciais para login:
   - admin@mvpvideo.test / senha123
   - editor@mvpvideo.test / senha123
   - viewer@mvpvideo.test / senha123
   - moderator@mvpvideo.test / senha123

IMPORTANTE: Em produção, NUNCA use senhas fracas como "senha123"!
*/
