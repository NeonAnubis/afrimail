/*
  # Create Core Tables for Mailcow Management Platform

  1. New Tables
    - `users_extended`
      - Stores extended user information beyond what Mailcow provides
      - Links to Mailcow mailboxes via email
      - Stores recovery contact information
      
    - `admin_users`
      - Stores admin credentials separately from regular users
      - Enables admin authentication independent of Mailcow
      
    - `password_resets`
      - Temporary storage for OTP codes during password reset flow
      - Supports both email and SMS delivery methods
      
    - `audit_logs`
      - Comprehensive logging of all admin actions
      - Enables compliance and security monitoring
      
    - `mailbox_metadata`
      - Caches Mailcow API data to reduce API calls
      - Stores quota and usage information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated user access
    - Add policies for admin-only operations
    - Restrict access based on user identity and role

  3. Indexes
    - Add indexes on frequently queried columns for performance
    - Email fields, timestamps, and foreign keys indexed
*/

-- Create users_extended table
CREATE TABLE IF NOT EXISTS users_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  recovery_email text,
  recovery_phone text,
  is_suspended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  otp_type text NOT NULL CHECK (otp_type IN ('email', 'sms')),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  admin_email text NOT NULL,
  target_user_email text,
  details jsonb,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);

-- Create mailbox_metadata table
CREATE TABLE IF NOT EXISTS mailbox_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  quota_bytes bigint DEFAULT 0,
  usage_bytes bigint DEFAULT 0,
  last_synced timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_extended_email ON users_extended(email);
CREATE INDEX IF NOT EXISTS idx_users_extended_created_at ON users_extended(created_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_email ON audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_mailbox_metadata_email ON mailbox_metadata(email);

-- Enable Row Level Security
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailbox_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_extended
CREATE POLICY "Users can view their own profile"
  ON users_extended FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

CREATE POLICY "Users can update their own profile"
  ON users_extended FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email')
  WITH CHECK (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

CREATE POLICY "Service role can insert users"
  ON users_extended FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can manage all users"
  ON users_extended FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for admin_users (only service role can access)
CREATE POLICY "Service role can manage admin users"
  ON admin_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for password_resets (service role only)
CREATE POLICY "Service role can manage password resets"
  ON password_resets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for audit_logs (service role only for write, authenticated for read)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can view all audit logs"
  ON audit_logs FOR SELECT
  TO service_role
  USING (true);

-- RLS Policies for mailbox_metadata
CREATE POLICY "Users can view their own mailbox metadata"
  ON mailbox_metadata FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Service role can manage mailbox metadata"
  ON mailbox_metadata FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users_extended
DROP TRIGGER IF EXISTS update_users_extended_updated_at ON users_extended;
CREATE TRIGGER update_users_extended_updated_at
  BEFORE UPDATE ON users_extended
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();