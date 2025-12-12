/*
  # Email Sending Limits & Abuse Prevention System

  1. New Tables
    - `sending_tiers`
      - Defines tier configurations (Free, Basic, Premium, Enterprise)
      - Includes daily/hourly limits, pricing, features
      - Used as reference for user tier assignments
    
    - `email_sending_limits`
      - User-specific sending configurations and current usage
      - Tracks daily/hourly limits, current tier, emails sent today
      - Last reset timestamp for daily counter
      - Enabled/disabled status for sending privileges
    
    - `email_send_logs`
      - Complete audit trail of all outgoing emails
      - Records timestamp, user, recipients, subject, status
      - Tracks failures, blocks, and reasons
      - Includes IP address for abuse pattern detection
    
    - `sending_limit_violations`
      - Records all limit violations and suspicious activity
      - Tracks violation type, attempted count vs limit
      - Stores action taken and resolution status
      - Used for abuse pattern analysis and reporting

  2. Security
    - Enable RLS on all tables
    - Service role has full access (used by admin API)
    - Regular users can only view their own sending data (not violations)
    - No public access to any tables
    - Separate policies for select, insert, update, delete

  3. Important Notes
    - Default tier is 'free' with 50 emails/day limit
    - Daily counters reset automatically at midnight (handled by application)
    - Indexes added for performance on high-traffic queries
    - Foreign keys ensure data integrity
    - All timestamps use timestamptz for timezone support
*/

-- Create sending_tiers table
CREATE TABLE IF NOT EXISTS sending_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  daily_limit integer NOT NULL,
  hourly_limit integer NOT NULL,
  price_monthly numeric(10, 2) DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sending_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage tiers"
  ON sending_tiers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view active tiers"
  ON sending_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create email_sending_limits table
CREATE TABLE IF NOT EXISTS email_sending_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES sending_tiers(id),
  tier_name text DEFAULT 'free',
  daily_limit integer DEFAULT 50,
  hourly_limit integer DEFAULT 10,
  emails_sent_today integer DEFAULT 0,
  emails_sent_this_hour integer DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  last_reset_hour timestamptz DEFAULT date_trunc('hour', now()),
  is_sending_enabled boolean DEFAULT true,
  custom_limit_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE email_sending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sending limits"
  ON email_sending_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sending limits"
  ON email_sending_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can update own counter"
  ON email_sending_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create email_send_logs table
CREATE TABLE IF NOT EXISTS email_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_count integer DEFAULT 1,
  subject text,
  status text DEFAULT 'sent',
  failure_reason text,
  blocked_reason text,
  ip_address inet,
  user_agent text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
  ON email_send_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email logs"
  ON email_send_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert own email logs"
  ON email_send_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create sending_limit_violations table
CREATE TABLE IF NOT EXISTS sending_limit_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type text NOT NULL,
  attempted_count integer NOT NULL,
  limit_at_time integer NOT NULL,
  violation_details jsonb DEFAULT '{}'::jsonb,
  action_taken text DEFAULT 'logged',
  admin_notes text,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sending_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all violations"
  ON sending_limit_violations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sending_limits_user_id ON email_sending_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sending_limits_tier ON email_sending_limits(tier_name);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_user_id ON email_send_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_sent_at ON email_send_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_user_sent ON email_send_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_status ON email_send_logs(status);
CREATE INDEX IF NOT EXISTS idx_violations_user_id ON sending_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_created ON sending_limit_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_unresolved ON sending_limit_violations(is_resolved) WHERE is_resolved = false;

-- Insert default tiers
INSERT INTO sending_tiers (name, display_name, daily_limit, hourly_limit, price_monthly, features, sort_order)
VALUES 
  ('free', 'Free', 50, 10, 0, '["Basic email sending", "Standard support", "Email templates"]'::jsonb, 1),
  ('basic', 'Basic', 500, 50, 9.99, '["Increased sending limits", "Priority support", "Advanced templates", "Email analytics"]'::jsonb, 2),
  ('premium', 'Premium', 2000, 200, 29.99, '["High volume sending", "Premium support", "Custom domains", "Advanced analytics", "API access"]'::jsonb, 3),
  ('enterprise', 'Enterprise', 999999, 99999, 99.99, '["Unlimited sending", "Dedicated support", "Custom integration", "SLA guarantee", "White label"]'::jsonb, 4)
ON CONFLICT (name) DO NOTHING;

-- Create trigger for email_sending_limits updated_at
DROP TRIGGER IF EXISTS update_email_sending_limits_updated_at ON email_sending_limits;
CREATE TRIGGER update_email_sending_limits_updated_at
  BEFORE UPDATE ON email_sending_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for sending_tiers updated_at
DROP TRIGGER IF EXISTS update_sending_tiers_updated_at ON sending_tiers;
CREATE TRIGGER update_sending_tiers_updated_at
  BEFORE UPDATE ON sending_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();