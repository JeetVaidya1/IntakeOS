-- ============================================================================
-- IntakeOS Database Schema
-- ============================================================================
-- This file contains the complete database schema for IntakeOS, including:
-- - Table definitions with all columns
-- - Foreign key relationships
-- - Row Level Security (RLS) policies
-- - Indexes for performance
-- ============================================================================

-- ============================================================================
-- TABLE: business_profiles
-- ============================================================================
-- Stores global business information for each user
-- Each user has ONE business profile that applies to all their bots
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  industry TEXT,
  business_description TEXT,
  products_services TEXT,
  location TEXT,
  website TEXT,
  target_audience TEXT,
  unique_selling_points TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own business profile
CREATE POLICY "Users can manage their own business profile"
  ON business_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_profiles_updated_at();

-- ============================================================================
-- TABLE: bots
-- ============================================================================
-- Stores bot configurations and metadata
-- Each bot belongs to a user and has a unique slug for public access
-- ============================================================================

CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL, -- Stores agentic_v1 or legacy field array schema
  notification_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own bots
CREATE POLICY "Users can manage their own bots"
  ON bots
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Public read access for active bots (needed for chat interface)
CREATE POLICY "Public can view active bots"
  ON bots
  FOR SELECT
  USING (is_active = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_slug ON bots(slug);
CREATE INDEX IF NOT EXISTS idx_bots_created_at ON bots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bots_is_active ON bots(is_active) WHERE is_active = true;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW
  EXECUTE FUNCTION update_bots_updated_at();

-- ============================================================================
-- TABLE: submissions
-- ============================================================================
-- Stores submission data collected from bot conversations
-- Each submission belongs to a bot and contains gathered information
-- ============================================================================

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Gathered information from conversation
  conversation JSONB, -- Full conversation history
  uploaded_files JSONB DEFAULT '[]'::jsonb, -- Array of uploaded file metadata
  uploaded_documents JSONB DEFAULT '[]'::jsonb, -- Array of documents with extracted text
  status TEXT DEFAULT 'new',
  summary TEXT, -- AI-generated 2-3 sentence snapshot
  sentiment TEXT, -- 'Positive', 'Neutral', or 'Frustrated'
  urgency TEXT, -- 'Low', 'Medium', or 'High'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see submissions for their own bots
CREATE POLICY "Users can view their own bot submissions"
  ON submissions
  FOR SELECT
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update submissions for their own bots
CREATE POLICY "Users can update their own bot submissions"
  ON submissions
  FOR UPDATE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete submissions for their own bots
CREATE POLICY "Users can delete their own bot submissions"
  ON submissions
  FOR DELETE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow inserts for active bots (public submissions)
-- Note: The API uses service role key which bypasses RLS, but this policy
-- provides an additional layer for direct database access
-- In WITH CHECK, we reference the NEW row's bot_id
CREATE POLICY "Allow inserts for active bots"
  ON submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = bot_id
      AND bots.is_active = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_bot_id ON submissions(bot_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_urgency ON submissions(urgency) WHERE urgency IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_sentiment ON submissions(sentiment) WHERE sentiment IS NOT NULL;
-- Composite index for common queries (bot submissions ordered by date)
CREATE INDEX IF NOT EXISTS idx_submissions_bot_created ON submissions(bot_id, created_at DESC);

-- ============================================================================
-- TABLE: integrations
-- ============================================================================
-- Stores webhook integrations for bots
-- Each bot can have ONE webhook integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL UNIQUE REFERENCES bots(id) ON DELETE CASCADE,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage integrations for their own bots
CREATE POLICY "Users can manage their own bot integrations"
  ON integrations
  FOR ALL
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_bot_id ON integrations(bot_id);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON integrations(is_active) WHERE is_active = true;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE business_profiles IS 'Global business information for each user, applies to all their bots';
COMMENT ON TABLE bots IS 'Bot configurations with agentic or legacy schemas';
COMMENT ON TABLE submissions IS 'Submission data collected from bot conversations';
COMMENT ON TABLE integrations IS 'Webhook integrations for bots';

COMMENT ON COLUMN bots.schema IS 'Stores either agentic_v1 schema (object with goal, system_prompt, required_info) or legacy field array';
COMMENT ON COLUMN submissions.data IS 'Gathered information from conversation as key-value pairs';
COMMENT ON COLUMN submissions.conversation IS 'Full conversation history for context';
COMMENT ON COLUMN submissions.uploaded_files IS 'Array of uploaded file metadata (url, filename, type, uploaded_at)';
COMMENT ON COLUMN submissions.uploaded_documents IS 'Array of documents with extracted text (filename, url, extracted_text, uploaded_at, uploaded_turn)';
COMMENT ON COLUMN submissions.summary IS 'AI-generated 2-3 sentence snapshot of the submission';
COMMENT ON COLUMN submissions.sentiment IS 'User sentiment: Positive, Neutral, or Frustrated';
COMMENT ON COLUMN submissions.urgency IS 'Submission urgency level: Low, Medium, or High';

