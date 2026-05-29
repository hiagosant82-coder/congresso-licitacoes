-- ============================================
-- SCRIPT DE RECUPERAÇÃO - Execute no SQL Editor do Supabase
-- ============================================
-- Este script recria o admin e a organização após DROP das tabelas.
-- NÃO apaga dados existentes.

DO $$
DECLARE
  admin_id UUID;
  org_id UUID;
BEGIN
  -- 1. Criar organização (se não existir)
  SELECT id INTO org_id FROM organizations WHERE name = 'Envolve Mato Grosso' LIMIT 1;
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (id, name, plan)
    VALUES (gen_random_uuid(), 'Envolve Mato Grosso', 'gratuito')
    RETURNING id INTO org_id;
  END IF;

  -- 2. Buscar o admin no auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@envolve.com.br' LIMIT 1;

  -- 3. Criar/atualizar perfil do admin
  IF admin_id IS NOT NULL THEN
    INSERT INTO profiles (id, organization_id, full_name, email, role)
    VALUES (admin_id, org_id, 'Administrador Envolve', 'admin@envolve.com.br', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET organization_id = org_id, role = 'admin';
    
    RAISE NOTICE 'Admin restaurado: %, Org: %', admin_id, org_id;
  ELSE
    RAISE NOTICE 'ERRO: admin@envolve.com.br não encontrado em auth.users';
  END IF;
END $$;

-- 4. Verificar resultado
SELECT p.id, p.full_name, p.email, p.role, p.organization_id, o.name as org_name
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.email = 'admin@envolve.com.br';
