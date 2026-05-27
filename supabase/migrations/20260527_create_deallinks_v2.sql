-- Create deallinks_v2 table (next-gen landing page editor)
CREATE TABLE deallinks_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Prospect & Deal Info
  prospect_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  deal_type VARCHAR(50) NOT NULL,
  deal_value DECIMAL(10, 2),
  deal_context TEXT,

  -- Design & Content
  template_name VARCHAR(50) NOT NULL DEFAULT 'clean_enterprise',
  config JSONB NOT NULL,
  html_rendered TEXT,
  css_rendered TEXT,

  -- Lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Public Access
  public_slug VARCHAR(36) UNIQUE NOT NULL,

  CONSTRAINT deallinks_v2_unique_key UNIQUE(user_id, prospect_name, company_name)
);

-- Indexes
CREATE INDEX idx_deallinks_v2_user_id ON deallinks_v2(user_id);
CREATE INDEX idx_deallinks_v2_status ON deallinks_v2(status);
CREATE INDEX idx_deallinks_v2_public_slug ON deallinks_v2(public_slug);
CREATE INDEX idx_deallinks_v2_created_at ON deallinks_v2(created_at DESC);

-- RLS
ALTER TABLE deallinks_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_deallinks_v2"
  ON deallinks_v2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_deallinks_v2"
  ON deallinks_v2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_deallinks_v2"
  ON deallinks_v2 FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anyone_can_view_published_deallinks_v2"
  ON deallinks_v2 FOR SELECT
  USING (status = 'published');

-- Create analytics table
CREATE TABLE deallink_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deallink_id UUID NOT NULL REFERENCES deallinks_v2(id) ON DELETE CASCADE,

  event_type VARCHAR(20) NOT NULL,
  device_type VARCHAR(20),

  visitor_ip VARCHAR(45),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_seconds INTEGER,

  metadata JSONB
);

CREATE INDEX idx_deallink_analytics_deallink_id ON deallink_analytics(deallink_id);
CREATE INDEX idx_deallink_analytics_timestamp ON deallink_analytics(timestamp DESC);
