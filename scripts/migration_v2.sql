-- ============================================
-- MIGRATION V2: Progress persistence + Comments
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. User progress table (journey, watched lectures, tasks)
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

-- 2. Content comments table (real server-side comments)
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_item_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_participant ON user_progress(participant_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_schedule ON content_comments(schedule_item_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_created ON content_comments(created_at DESC);

-- RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- RLS: user_progress
CREATE POLICY "Participants can manage own progress"
  ON user_progress FOR ALL
  USING (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()))
  WITH CHECK (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view participant progress"
  ON user_progress FOR SELECT
  USING (participant_id IN (SELECT id FROM participants WHERE organization_id = get_user_org()) AND get_user_role() IN ('admin', 'operator'));

-- RLS: content_comments
CREATE POLICY "Participants can manage own comments"
  ON content_comments FOR ALL
  USING (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()))
  WITH CHECK (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view comments"
  ON content_comments FOR SELECT
  USING (true);

-- Fix storage RLS: only allow participants to download files from their org
DROP POLICY IF EXISTS "Participants download own materials" ON storage.objects;
CREATE POLICY "Participants download own materials"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materials'
    AND get_user_role() = 'participant'
    AND get_user_org() IS NOT NULL
    AND (storage.foldername(name))[1] = get_user_org()::text
  );

-- updated_at trigger for user_progress
DROP TRIGGER IF EXISTS set_user_progress_updated_at ON user_progress;
CREATE TRIGGER set_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
