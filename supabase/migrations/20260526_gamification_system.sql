-- GAMIFICATION SYSTEM — Tables for points, badges, interactions
-- Phase 1-4 Production-Ready Implementation

-- 1. Add is_vip column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- 2. user_points — Gamification points (separate from meeting points_balance)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  total_points INT DEFAULT 0,
  lifetime_points INT DEFAULT 0,
  last_milestone_unlocked INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_points_read ON user_points
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. user_points_history — Audit trail
CREATE TABLE IF NOT EXISTS user_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points_earned INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  action_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_user ON user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_action ON user_points_history(action);
CREATE INDEX IF NOT EXISTS idx_points_history_created ON user_points_history(created_at DESC);

ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_points_history_read ON user_points_history
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. user_badges — Badge unlock tracking
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_badges_read ON user_badges FOR SELECT USING (true);

-- 5. project_interactions — Likes, suggestions, collaborations
CREATE TABLE IF NOT EXISTS project_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Type of interaction
  type VARCHAR(50) NOT NULL,  -- 'like' | 'suggestion' | 'collaboration'

  -- For suggestions
  suggestion_content TEXT,
  suggestion_type VARCHAR(50),  -- 'improvement' | 'question' | 'issue' | 'resource'

  -- For collaborations
  collab_domain VARCHAR(100),
  collab_message TEXT,
  collab_availability VARCHAR(50),  -- 'immediate' | '2-4weeks' | 'flexible'
  collab_status VARCHAR(50) DEFAULT 'pending',  -- 'pending' | 'active' | 'completed' | 'rejected' | 'expired'
  collab_accepted_at TIMESTAMPTZ,
  collab_completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_interactions_project ON project_interactions(project_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON project_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON project_interactions(type);
CREATE INDEX IF NOT EXISTS idx_collab_status ON project_interactions(collab_status);

ALTER TABLE project_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_interactions_read ON project_interactions FOR SELECT USING (true);
CREATE POLICY project_interactions_insert ON project_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY project_interactions_update ON project_interactions
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );
