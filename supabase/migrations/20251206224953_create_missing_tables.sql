/*
  # Create Missing Tables
  
  1. New Tables
    - `custom_domains` - User custom domains for email
    - `activity_logs` - User activity tracking
    
  2. Updates to Existing Tables
    - Add user_id to mailbox_metadata
    - Add user_id, subject, message to support_tickets
    
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create custom_domains table if not exists
CREATE TABLE IF NOT EXISTS custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  user_id uuid REFERENCES users_extended(id) ON DELETE CASCADE,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_code text,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_user_id ON custom_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(verification_status);

ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage custom domains"
  ON custom_domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own domains"
  ON custom_domains FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_extended(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage activity logs"
  ON activity_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own activity"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Add user_id column to mailbox_metadata if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mailbox_metadata' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mailbox_metadata ADD COLUMN user_id uuid REFERENCES users_extended(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_mailbox_metadata_user_id ON mailbox_metadata(user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mailbox_metadata' AND column_name = 'last_sync'
  ) THEN
    ALTER TABLE mailbox_metadata ADD COLUMN last_sync timestamptz DEFAULT now();
  END IF;
END $$;

-- Update support_tickets table to match expected structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN user_id uuid REFERENCES users_extended(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'subject'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN subject text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'message'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN message text;
  END IF;
END $$;
