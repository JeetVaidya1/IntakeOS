# Database Migrations

This folder contains SQL migrations for the IntakeOS database.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended for Quick Fixes)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Paste and run the SQL

### Option 2: Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Migrations List

### `add_notification_email.sql`
**Purpose**: Adds `notification_email` column to the `bots` table

**When to run**: Before deploying the Quick Wins update

**What it does**:
- Adds a TEXT column `notification_email` to store where submission alerts should be sent
- New bots will automatically populate this field with the user's email
- Existing bots will need to have this field set via the Bot Settings page

**How to verify**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bots' AND column_name = 'notification_email';
```

### `add_file_storage_to_submissions.sql`
**Purpose**: Adds file storage columns to the `submissions` table for document intelligence

**When to run**: Before testing document uploads and file persistence features

**What it does**:
- Adds `uploaded_files` JSONB column to store file metadata (url, filename, type, uploaded_at)
- Adds `uploaded_documents` JSONB column to store extracted document text for persistent context
- Both columns default to empty arrays

**How to verify**:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'submissions'
  AND column_name IN ('uploaded_files', 'uploaded_documents');
```
