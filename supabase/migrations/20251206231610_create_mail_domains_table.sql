/*
  # Create Mail Domains Table

  Creates a table to manage system-wide mail domains for the email service.
  
  1. New Tables
    - `mail_domains`
      - `id` (uuid, primary key)
      - `domain` (text, unique) - Domain name
      - `is_primary` (boolean) - Whether this is the primary domain
      - `is_active` (boolean) - Whether domain is active
      - `description` (text) - Optional description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `mail_domains` table
    - Add policy for service_role to manage domains
  
  3. Demo Data
    - Insert afrimail.com as primary domain
    - Insert additional demo domains
*/

-- Create mail_domains table
CREATE TABLE IF NOT EXISTS mail_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mail_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role
CREATE POLICY "Service role can manage mail domains"
  ON mail_domains
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_mail_domains_domain ON mail_domains(domain);
CREATE INDEX IF NOT EXISTS idx_mail_domains_is_primary ON mail_domains(is_primary) WHERE is_primary = true;

-- Insert demo domains
INSERT INTO mail_domains (domain, is_primary, is_active, description, created_at)
VALUES
  (
    'afrimail.com',
    true,
    true,
    'Primary mail domain for Afrimail service',
    NOW() - INTERVAL '2 years'
  ),
  (
    'mail.afrimail.com',
    false,
    true,
    'Alternative mail subdomain',
    NOW() - INTERVAL '18 months'
  ),
  (
    'business.afrimail.com',
    false,
    true,
    'Business mail domain for enterprise customers',
    NOW() - INTERVAL '1 year'
  ),
  (
    'secure.afrimail.com',
    false,
    true,
    'Enhanced security mail domain',
    NOW() - INTERVAL '8 months'
  ),
  (
    'legacy.afrimail.com',
    false,
    false,
    'Legacy domain - being phased out',
    NOW() - INTERVAL '3 years'
  )
ON CONFLICT (domain) DO NOTHING;

-- Create function to ensure only one primary domain
CREATE OR REPLACE FUNCTION ensure_single_primary_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE mail_domains
    SET is_primary = false
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_primary ON mail_domains;
CREATE TRIGGER trigger_ensure_single_primary
  BEFORE INSERT OR UPDATE ON mail_domains
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_domain();
