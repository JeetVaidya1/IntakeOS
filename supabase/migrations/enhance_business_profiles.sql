-- Add enhanced fields to business_profiles for richer agentic context
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS products_services TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS unique_selling_points TEXT;

-- Add comments to document what each field is for
COMMENT ON COLUMN business_profiles.business_description IS 'Detailed description of what the business does';
COMMENT ON COLUMN business_profiles.products_services IS 'What products or services the business offers';
COMMENT ON COLUMN business_profiles.location IS 'Primary business location (city, state, or service area)';
COMMENT ON COLUMN business_profiles.website IS 'Business website URL';
COMMENT ON COLUMN business_profiles.target_audience IS 'Who the business serves (e.g., couples getting married, homeowners, small businesses)';
COMMENT ON COLUMN business_profiles.unique_selling_points IS 'What makes this business special or different from competitors';
