-- Add file storage columns to submissions table
-- This enables storing uploaded files and extracted document content

-- Add uploaded_files column to store file metadata
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]'::jsonb;

-- Add uploaded_documents column to store extracted document text
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN submissions.uploaded_files IS 'Array of uploaded file metadata (url, filename, type, uploaded_at)';
COMMENT ON COLUMN submissions.uploaded_documents IS 'Array of uploaded documents with extracted text (filename, url, extracted_text, uploaded_at, uploaded_turn)';
