-- Add UNIQUE constraint to bot_id if it doesn't exist
-- This fixes the upsert operation in BotSettings

-- Drop the constraint if it exists (in case we're re-running)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'integrations_bot_id_unique'
    ) THEN
        ALTER TABLE integrations DROP CONSTRAINT integrations_bot_id_unique;
    END IF;
END $$;

-- Add the UNIQUE constraint
ALTER TABLE integrations
ADD CONSTRAINT integrations_bot_id_unique UNIQUE (bot_id);
