-- ============================================
-- SCHEMA: PORTAL DE MEMBROS + CRM OPERACIONAL
-- ============================================
-- ATENÇÃO: As linhas DROP TABLE abaixo apagam TODOS os dados.
-- Execute apenas na PRIMEIRA instalação (banco vazio).
-- Para migrações incrementais, execute a partir da linha 185.
-- ============================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USE APENAS NA PRIMEIRA INSTALAÇÃO:
-- Descomente as linhas abaixo se for criar o banco do zero.
-- ============================================
-- DROP TABLE IF EXISTS certificates CASCADE;
-- DROP TABLE IF EXISTS schedules CASCADE;
-- DROP TABLE IF EXISTS file_access CASCADE;
-- DROP TABLE IF EXISTS files CASCADE;
-- DROP TABLE IF EXISTS activity_log CASCADE;
-- DROP TABLE IF EXISTS participants CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- 1. Organizations (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'gratuito',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'operator', 'participant')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  position TEXT,
  workplace TEXT,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'confirmado', 'pagamento_pendente', 'ativo', 'finalizado')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  access_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (access_status IN ('pending_payment', 'invited', 'active', 'blocked')),
  notes TEXT,
  tags TEXT[],
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Activity log (histórico)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Files / Materials
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  category TEXT,
  visible_to_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. File access (quais participantes podem ver cada arquivo)
CREATE TABLE file_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, participant_id)
);

-- 7. Schedule / Programação
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  speaker TEXT,
  speaker_bio TEXT,
  location TEXT,
  order_index INT NOT NULL DEFAULT 0,
  day_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  certificate_url TEXT,
  issued BOOLEAN NOT NULL DEFAULT false,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_participants_org ON participants(organization_id);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_payment ON participants(payment_status);
CREATE INDEX idx_participants_access ON participants(access_status);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_activity_log_org ON activity_log(organization_id);
CREATE INDEX idx_activity_log_participant ON activity_log(participant_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_files_org ON files(organization_id);
CREATE INDEX idx_file_access_file ON file_access(file_id);
CREATE INDEX idx_file_access_participant ON file_access(participant_id);
CREATE INDEX idx_schedules_org ON schedules(organization_id);
CREATE INDEX idx_schedules_day ON schedules(day_number);
CREATE INDEX idx_certificates_org ON certificates(organization_id);
CREATE INDEX idx_certificates_participant ON certificates(participant_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  user_name TEXT;
BEGIN
  -- 1. Try to get organization_id from metadata first
  BEGIN
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    org_id := NULL;
  END;

  -- 2. If no org_id in metadata, look up from existing participant record
  IF org_id IS NULL THEN
    SELECT p.organization_id INTO org_id
    FROM participants p
    WHERE p.email = NEW.email
    LIMIT 1;
  END IF;

  -- 3. Safely extract full_name
  BEGIN
    user_name := NEW.raw_user_meta_data->>'full_name';
  EXCEPTION WHEN OTHERS THEN
    user_name := NULL;
  END;

  -- 4. If no full_name from metadata, try participant record
  IF user_name IS NULL THEN
    SELECT p.full_name INTO user_name
    FROM participants p
    WHERE p.email = NEW.email
    LIMIT 1;
  END IF;

  -- 5. Insert profile record
  INSERT INTO profiles (id, organization_id, full_name, email, role)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(user_name, NEW.email),
    NEW.email,
    'participant'
  );

  -- 6. Link participant record to this auth user
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Helper: get user's organization_id
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- RLS Policies: organizations
-- ============================================

CREATE POLICY "Admins can view their own org"
  ON organizations FOR SELECT
  USING (id = get_user_org() AND get_user_role() = 'admin');

CREATE POLICY "Operators can view their own org"
  ON organizations FOR SELECT
  USING (id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Admins can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- ============================================
-- RLS Policies: profiles
-- ============================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view org profiles"
  ON profiles FOR SELECT
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- RLS Policies: participants
-- ============================================

CREATE POLICY "Participants see own data"
  ON participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff sees org participants"
  ON participants FOR SELECT
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Staff can insert participants"
  ON participants FOR INSERT
  WITH CHECK (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Staff can update participants"
  ON participants FOR UPDATE
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'))
  WITH CHECK (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Staff can delete participants"
  ON participants FOR DELETE
  USING (organization_id = get_user_org() AND get_user_role() = 'admin');

CREATE POLICY "Public can insert participants for any org"
  ON participants FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS Policies: activity_log
-- ============================================

CREATE POLICY "Staff see org activity"
  ON activity_log FOR SELECT
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Staff can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

-- ============================================
-- RLS Policies: files
-- ============================================

CREATE POLICY "Staff full access to files"
  ON files FOR ALL
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

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
-- RLS Policies: file_access
-- ============================================

CREATE POLICY "Staff full access to file_access"
  ON file_access FOR ALL
  USING (
    file_id IN (SELECT id FROM files WHERE organization_id = get_user_org())
    AND get_user_role() IN ('admin', 'operator')
  );

CREATE POLICY "Participants see own file access"
  ON file_access FOR SELECT
  USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS Policies: schedules
-- ============================================

CREATE POLICY "Anyone in org can view schedules"
  ON schedules FOR SELECT
  USING (organization_id = get_user_org());

CREATE POLICY "Staff can manage schedules"
  ON schedules FOR ALL
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

-- ============================================
-- RLS Policies: certificates
-- ============================================

CREATE POLICY "Participants see own certificates"
  ON certificates FOR SELECT
  USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff sees org certificates"
  ON certificates FOR SELECT
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

CREATE POLICY "Staff can manage certificates"
  ON certificates FOR ALL
  USING (organization_id = get_user_org() AND get_user_role() IN ('admin', 'operator'));

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Staff can upload/download
DROP POLICY IF EXISTS "Staff full storage access" ON storage.objects;
CREATE POLICY "Staff full storage access"
  ON storage.objects FOR ALL
  USING (get_user_role() IN ('admin', 'operator'))
  WITH CHECK (get_user_role() IN ('admin', 'operator'));

-- Storage RLS: Participants can download only from their org folder
DROP POLICY IF EXISTS "Participants download own materials" ON storage.objects;
CREATE POLICY "Participants download own materials"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materials'
    AND get_user_role() = 'participant'
    AND get_user_org() IS NOT NULL
    AND (storage.foldername(name))[1] = get_user_org()::text
  );

-- ============================================
-- USER PROGRESS TABLE
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

-- ============================================
-- CONTENT COMMENTS TABLE
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
-- UPDATED_AT triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_org_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_profile_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_participant_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_file_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_schedule_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
