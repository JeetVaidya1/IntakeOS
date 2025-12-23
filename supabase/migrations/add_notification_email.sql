-- Add notification_email column to bots table
-- This column stores the email address where submission notifications should be sent

ALTER TABLE bots
ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN bots.notification_email IS 'Email address to receive submission notifications';

-- NOTE: For existing bots without notification_email,
-- the application will need to backfill this column.
-- New bots will have this field populated automatically during creation.
