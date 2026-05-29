-- ============================================
-- MIGRAÇÕES INCREMENTAIS - Execute no SQL Editor
-- ============================================
-- Este arquivo NÃO apaga dados. Apenas aplica mudanças incrementais.
-- Execute sempre que atualizar o código da aplicação.

-- ============================================
-- 1. Atualizar TRIGGER: handle_new_user
-- ============================================
-- Agora busca organization_id do participant existente pelo email
-- e atualiza user_id + access_status automaticamente.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  user_name TEXT;
BEGIN
  -- Try to get organization_id from metadata first
  BEGIN
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    org_id := NULL;
  END;

  -- If no org_id in metadata, look up from existing participant record
  IF org_id IS NULL THEN
    SELECT p.organization_id INTO org_id
    FROM participants p
    WHERE p.email = NEW.email
    LIMIT 1;
  END IF;

  -- Safely extract full_name
  BEGIN
    user_name := NEW.raw_user_meta_data->>'full_name';
  EXCEPTION WHEN OTHERS THEN
    user_name := NULL;
  END;

  -- If no full_name from metadata, try participant record
  IF user_name IS NULL THEN
    SELECT p.full_name INTO user_name
    FROM participants p
    WHERE p.email = NEW.email
    LIMIT 1;
  END IF;

  -- Insert profile record (upsert for idempotency)
  INSERT INTO profiles (id, organization_id, full_name, email, role)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(user_name, NEW.email),
    NEW.email,
    'participant'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Link participant record to this auth user
  UPDATE participants
  SET user_id = NEW.id,
      access_status = 'active',
      status = 'ativo'
  WHERE email = NEW.email AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 1.1 Permissão para auto-criação de perfil (Self-healing)
-- ============================================
-- Permite que o próprio usuário insira seu perfil caso o trigger falhe ou atrase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 2. Atualizar RLS: files para participantes
-- ============================================

DROP POLICY IF EXISTS "Participants see visible or assigned files" ON files;
CREATE POLICY "Participants see visible or assigned files"
  ON files FOR SELECT
  USING (
    (get_user_org() IS NOT NULL AND organization_id = get_user_org() AND visible_to_all = true)
    OR
    (id IN (
      SELECT file_id FROM file_access
      JOIN participants ON participants.id = file_access.participant_id
      WHERE participants.user_id = auth.uid()
    ))
  );

-- ============================================
-- 3. Garantir policies de INSERT para organizations
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Admins can insert organizations' AND tablename = 'organizations'
  ) THEN
    CREATE POLICY "Admins can insert organizations"
      ON organizations FOR INSERT
      WITH CHECK (get_user_role() = 'admin');
  END IF;
END $$;

-- ============================================
-- 4. Corrigir profiles existentes sem organization_id
-- ============================================

UPDATE profiles p
SET organization_id = parts.organization_id
FROM participants parts
WHERE p.organization_id IS NULL
  AND p.email = parts.email
  AND parts.organization_id IS NOT NULL;

-- ============================================
-- 5. User progress table (journey persistence)
-- ============================================

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  journey_active BOOLEAN NOT NULL DEFAULT false,
  watched_lectures TEXT[] NOT NULL DEFAULT '{}',
  completed_tasks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_participant ON user_progress(participant_id);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can manage own progress"
  ON user_progress FOR ALL
  USING (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()))
  WITH CHECK (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view participant progress"
  ON user_progress FOR SELECT
  USING (participant_id IN (SELECT id FROM participants WHERE organization_id = get_user_org()) AND get_user_role() IN ('admin', 'operator'));

CREATE TRIGGER set_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. Content comments table (real comments)
-- ============================================

CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_item_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_comments_schedule ON content_comments(schedule_item_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_created ON content_comments(created_at DESC);

ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can manage own comments"
  ON content_comments FOR ALL
  USING (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()))
  WITH CHECK (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view comments"
  ON content_comments FOR SELECT
  USING (true);

-- ============================================
-- 7. Fix storage RLS (org-scoped download)
-- ============================================

DROP POLICY IF EXISTS "Participants download own materials" ON storage.objects;
CREATE POLICY "Participants download own materials"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materials'
    AND get_user_role() = 'participant'
    AND get_user_org() IS NOT NULL
    AND (storage.foldername(name))[1] = get_user_org()::text
  );
