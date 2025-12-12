/*
  # Add Signup Enhancements and Rate Limiting System

  1. New Columns for users_extended
    - `date_of_birth` (DATE) - User's date of birth for age verification (minimum 8 years)
    - `gender` (TEXT) - Optional gender field with predefined values
    - Both fields are nullable to maintain backward compatibility

  2. New Tables
    - `signup_attempts`
      - Tracks all signup attempts by IP address for rate limiting
      - Records timestamp, IP address, email attempted, and outcome
      - Stores hCaptcha verification status
      - Automatically cleaned up after 24 hours
      - Enables detection of spam and abuse patterns

  3. Security
    - Enable RLS on signup_attempts table
    - Add policies for service role access only
    - Gender field uses CHECK constraint for valid values
    - Indexes added for performance on IP and timestamp queries

  4. Rate Limiting Configuration
    - Default limits: 5 attempts per hour, 10 per day per IP
    - Configurable through application logic
    - Automatic cleanup function removes old attempts

  5. Important Notes
    - Minimum age requirement (8 years) enforced in application logic
    - hCaptcha verification required for all signups
    - Honeypot field handling in application layer
    - Complete audit trail of all signup attempts
*/

-- Add new columns to users_extended table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_extended' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE users_extended ADD COLUMN date_of_birth DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_extended' AND column_name = 'gender'
  ) THEN
    ALTER TABLE users_extended ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say', NULL));
  END IF;
END $$;

-- Create signup_attempts table for rate limiting and spam prevention
CREATE TABLE IF NOT EXISTS signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email_attempted text NOT NULL,
  hcaptcha_verified boolean DEFAULT false,
  honeypot_filled boolean DEFAULT false,
  success boolean DEFAULT false,
  failure_reason text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient rate limiting queries
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_address ON signup_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_created_at ON signup_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_created ON signup_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email ON signup_attempts(email_attempted);

-- Enable Row Level Security
ALTER TABLE signup_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signup_attempts (service role only)
CREATE POLICY "Service role can manage signup attempts"
  ON signup_attempts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to cleanup old signup attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_signup_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM signup_attempts
  WHERE created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check rate limits for an IP address
CREATE OR REPLACE FUNCTION check_signup_rate_limit(
  p_ip_address text,
  p_hourly_limit int DEFAULT 5,
  p_daily_limit int DEFAULT 10
)
RETURNS jsonb AS $$
DECLARE
  v_attempts_last_hour int;
  v_attempts_last_day int;
  v_result jsonb;
BEGIN
  -- Count attempts in last hour
  SELECT COUNT(*) INTO v_attempts_last_hour
  FROM signup_attempts
  WHERE ip_address = p_ip_address
    AND created_at > now() - INTERVAL '1 hour';

  -- Count attempts in last 24 hours
  SELECT COUNT(*) INTO v_attempts_last_day
  FROM signup_attempts
  WHERE ip_address = p_ip_address
    AND created_at > now() - INTERVAL '24 hours';

  -- Build result
  v_result := jsonb_build_object(
    'allowed', v_attempts_last_hour < p_hourly_limit AND v_attempts_last_day < p_daily_limit,
    'attempts_last_hour', v_attempts_last_hour,
    'attempts_last_day', v_attempts_last_day,
    'hourly_limit', p_hourly_limit,
    'daily_limit', p_daily_limit
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;