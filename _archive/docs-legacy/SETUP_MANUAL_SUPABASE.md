# 🚀 SETUP MANUAL DO SUPABASE

## ⚠️ IMPORTANTE
O setup automático não funcionou devido a limitações da API. Siga estas instruções para configurar manualmente.

## 📋 PASSO A PASSO

### 1. Acesse o SQL Editor do Supabase
Abra: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/sql

### 2. Execute o SQL abaixo

```sql
-- Criar tabela nr_courses
CREATE TABLE IF NOT EXISTS public.nr_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nr_number VARCHAR(10) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER DEFAULT 60,
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.nr_courses ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura pública
CREATE POLICY "Allow public read access" ON public.nr_courses
FOR SELECT USING (true);

-- Inserir dados de exemplo
INSERT INTO public.nr_courses (nr_number, title, description, thumbnail_url, duration_minutes, difficulty_level) 
VALUES 
    ('NR-12', 'Segurança no Trabalho em Máquinas e Equipamentos', 'Curso sobre segurança em máquinas e equipamentos conforme NR-12', '/thumbnails/nr12-thumb.jpg', 120, 'intermediate'),
    ('NR-33', 'Segurança e Saúde nos Trabalhos em Espaços Confinados', 'Curso sobre trabalho em espaços confinados conforme NR-33', '/thumbnails/nr33-thumb.jpg', 90, 'advanced'),
    ('NR-35', 'Trabalho em Altura', 'Curso sobre trabalho em altura conforme NR-35', '/thumbnails/nr35-thumb.jpg', 80, 'intermediate')
ON CONFLICT (nr_number) DO NOTHING;
```

### 3. Verificar se funcionou
Execute este comando no terminal após o setup:

```bash
node test-nr-courses.js
```

## 📊 STATUS ATUAL

✅ **Configurações TTS**: Azure Speech Services e ElevenLabs configurados  
✅ **Storage Buckets**: avatars, thumbnails, assets, videos configurados  
⚠️ **Tabelas do Banco**: Precisam ser criadas manualmente  

## 🔧 PRÓXIMOS PASSOS

1. Execute o SQL acima no Dashboard do Supabase
2. Execute `node test-nr-courses.js` para verificar
3. Execute `npm run test:supabase` para testes completos

## 📞 SUPORTE

Se houver problemas, verifique:
- Se você está logado no Supabase Dashboard
- Se o projeto `ofhzrdiadxigrvmrhaiz` está acessível
- Se as credenciais no `.env` estão corretas