-- Add intelligence fields to submissions table
-- These fields support AI-generated insights for a better dashboard experience

-- Add summary column for AI-generated snapshots
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add sentiment column to track user sentiment
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS sentiment TEXT;

-- Add urgency column to track submission urgency
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS urgency TEXT;

-- Add comments for documentation
COMMENT ON COLUMN submissions.summary IS 'AI-generated 2-3 sentence snapshot of the submission';
COMMENT ON COLUMN submissions.sentiment IS 'User sentiment: Positive, Neutral, or Frustrated';
COMMENT ON COLUMN submissions.urgency IS 'Submission urgency level: Low, Medium, or High';
