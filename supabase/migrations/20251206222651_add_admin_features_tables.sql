/*
  # Add Admin Features Tables

  This migration adds tables to support advanced admin features:
  
  1. New Tables
    - `login_activity`
      - Tracks user login attempts and patterns
      - Stores timestamps, IP addresses, success/failure status
      - Enables inactive account detection and security monitoring
      
    - `email_aliases`
      - Manages email aliases and distribution lists
      - Links aliases to target mailboxes
      - Supports group email functionality
      
    - `announcements`
      - Stores system-wide announcements and notifications
      - Supports targeting specific user groups
      - Tracks delivery and read status
      
    - `system_settings`
      - Stores configurable system parameters
      - Includes quota presets, blocklists, maintenance mode
      - Enables dynamic configuration without code changes
      
    - `support_tickets`
      - Tracks user support requests
      - Manages password reset approvals and account unlocks
      - Enables support workflow management

  2. Security
    - Enable RLS on all tables
    - Restrict access to service role for sensitive operations
    - Add policies for admin viewing with authentication

  3. Indexes
    - Add indexes on frequently queried columns
    - Optimize for reporting and analytics queries
*/

-- Create login_activity table
CREATE TABLE IF NOT EXISTS login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  login_time timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  success boolean NOT NULL,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create email_aliases table
CREATE TABLE IF NOT EXISTS email_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_address text UNIQUE NOT NULL,
  target_addresses text[] NOT NULL,
  is_distribution_list boolean DEFAULT false,
  description text,
  active boolean DEFAULT true,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_group text DEFAULT 'all',
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published boolean DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_by text,
  updated_at timestamptz DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type text NOT NULL CHECK (ticket_type IN ('password_reset', 'account_unlock', 'quota_increase', 'general')),
  user_email text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  description text,
  resolution_notes text,
  assigned_to text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_activity_user_email ON login_activity(user_email);
CREATE INDEX IF NOT EXISTS idx_login_activity_login_time ON login_activity(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_success ON login_activity(success);

CREATE INDEX IF NOT EXISTS idx_email_aliases_alias_address ON email_aliases(alias_address);
CREATE INDEX IF NOT EXISTS idx_email_aliases_active ON email_aliases(active);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_email ON support_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_activity
CREATE POLICY "Service role can manage login activity"
  ON login_activity FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_aliases
CREATE POLICY "Service role can manage email aliases"
  ON email_aliases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for announcements
CREATE POLICY "Service role can manage announcements"
  ON announcements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (published = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS Policies for system_settings
CREATE POLICY "Service role can manage system settings"
  ON system_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for support_tickets
CREATE POLICY "Service role can manage support tickets"
  ON support_tickets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_email = auth.jwt()->>'email');

-- Create trigger for email_aliases updated_at
DROP TRIGGER IF EXISTS update_email_aliases_updated_at ON email_aliases;
CREATE TRIGGER update_email_aliases_updated_at
  BEFORE UPDATE ON email_aliases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for support_tickets updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('quota_presets', '{"presets": [{"name": "Basic", "value": 1073741824}, {"name": "Standard", "value": 5368709120}, {"name": "Premium", "value": 10737418240}, {"name": "Business", "value": 26843545600}]}', 'Default quota presets in bytes'),
  ('maintenance_mode', '{"enabled": false, "message": "System maintenance in progress. Please try again later."}', 'Maintenance mode configuration'),
  ('signup_blocklist', '{"domains": [], "patterns": []}', 'Blocked email domains and patterns for signup'),
  ('default_user_quota', '{"value": 5368709120}', 'Default quota for new users in bytes (5GB)')
ON CONFLICT (setting_key) DO NOTHING;

-- Add last_login column to users_extended if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_extended' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users_extended ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Add failed_login_attempts column to users_extended if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_extended' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE users_extended ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;
END $$;

-- Add locked_until column to users_extended if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_extended' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE users_extended ADD COLUMN locked_until timestamptz;
  END IF;
END $$;