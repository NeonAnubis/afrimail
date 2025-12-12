/*
  # Populate Demo Data for Sending Limits System

  1. Data Population
    - Create email sending limits for existing users with various tiers
    - Generate sample email send logs for the past 30 days
    - Create sample sending limit violations for testing
    - Ensure realistic data distribution across free, basic, premium tiers

  2. Demo Data Details
    - 10 users with free tier (50/day limit) at various usage levels
    - 5 users with basic tier (500/day limit)
    - 3 users with premium tier (2000/day limit)
    - 2 users with enterprise tier (unlimited)
    - Email send logs spanning last 30 days
    - Some violations for users who exceeded limits

  3. Notes
    - Uses existing users from users_extended table
    - Creates realistic sending patterns
    - Includes both active and suspended sending status
    - Some users near/at limits for testing alerts
*/

-- First, let's get some user IDs from auth.users to use for demo data
-- We'll create sending limits for first 20 users

DO $$
DECLARE
  user_record RECORD;
  user_count INTEGER := 0;
  emails_sent INTEGER;
  log_date TIMESTAMPTZ;
  i INTEGER;
  tier TEXT;
  daily_limit INTEGER;
BEGIN
  -- Create sending limits for users with various tiers
  FOR user_record IN (
    SELECT id FROM auth.users ORDER BY created_at LIMIT 20
  )
  LOOP
    user_count := user_count + 1;
    
    -- Assign tier based on user count for variety
    IF user_count <= 10 THEN
      tier := 'free';
      daily_limit := 50;
      emails_sent := FLOOR(RANDOM() * 60)::INTEGER;
    ELSIF user_count <= 15 THEN
      tier := 'basic';
      daily_limit := 500;
      emails_sent := FLOOR(RANDOM() * 450)::INTEGER;
    ELSIF user_count <= 18 THEN
      tier := 'premium';
      daily_limit := 2000;
      emails_sent := FLOOR(RANDOM() * 1800)::INTEGER;
    ELSE
      tier := 'enterprise';
      daily_limit := 999999;
      emails_sent := FLOOR(RANDOM() * 1000)::INTEGER;
    END IF;

    -- Insert sending limit
    INSERT INTO email_sending_limits (
      user_id,
      tier_name,
      daily_limit,
      hourly_limit,
      emails_sent_today,
      emails_sent_this_hour,
      last_reset_date,
      last_reset_hour,
      is_sending_enabled,
      custom_limit_reason
    ) VALUES (
      user_record.id,
      tier,
      daily_limit,
      CASE 
        WHEN tier = 'free' THEN 10
        WHEN tier = 'basic' THEN 50
        WHEN tier = 'premium' THEN 200
        ELSE 99999
      END,
      emails_sent,
      FLOOR(RANDOM() * 10)::INTEGER,
      CURRENT_DATE,
      date_trunc('hour', now()),
      CASE WHEN RANDOM() < 0.1 THEN false ELSE true END,
      CASE WHEN RANDOM() < 0.1 THEN 'Suspended for abuse' ELSE NULL END
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Create email send logs for the past 30 days
    FOR i IN 1..LEAST(emails_sent, 50) LOOP
      log_date := now() - (FLOOR(RANDOM() * 30)::INTEGER || ' days')::INTERVAL - (FLOOR(RANDOM() * 24)::INTEGER || ' hours')::INTERVAL;
      
      INSERT INTO email_send_logs (
        user_id,
        recipient_email,
        recipient_count,
        subject,
        status,
        failure_reason,
        blocked_reason,
        ip_address,
        sent_at,
        created_at
      ) VALUES (
        user_record.id,
        'recipient' || FLOOR(RANDOM() * 1000) || '@example.com',
        1,
        CASE 
          WHEN RANDOM() < 0.3 THEN 'Monthly Newsletter'
          WHEN RANDOM() < 0.5 THEN 'Account Update'
          WHEN RANDOM() < 0.7 THEN 'Password Reset Request'
          ELSE 'Important Notification'
        END,
        CASE 
          WHEN RANDOM() < 0.9 THEN 'sent'
          WHEN RANDOM() < 0.95 THEN 'failed'
          ELSE 'blocked'
        END,
        CASE WHEN RANDOM() < 0.05 THEN 'Invalid recipient' ELSE NULL END,
        CASE WHEN RANDOM() < 0.03 THEN 'Spam detected' ELSE NULL END,
        '192.168.' || FLOOR(RANDOM() * 255) || '.' || FLOOR(RANDOM() * 255),
        log_date,
        log_date
      );
    END LOOP;

    -- Create some violations for users who exceeded limits (20% chance)
    IF RANDOM() < 0.2 AND emails_sent > daily_limit THEN
      INSERT INTO sending_limit_violations (
        user_id,
        violation_type,
        attempted_count,
        limit_at_time,
        violation_details,
        action_taken,
        admin_notes,
        is_resolved,
        created_at
      ) VALUES (
        user_record.id,
        CASE 
          WHEN RANDOM() < 0.4 THEN 'exceeded_daily_limit'
          WHEN RANDOM() < 0.7 THEN 'suspicious_pattern'
          ELSE 'rapid_sending'
        END,
        emails_sent,
        daily_limit,
        jsonb_build_object(
          'reason', 'Automated detection',
          'spike_detected', true,
          'previous_average', daily_limit / 2
        ),
        CASE 
          WHEN RANDOM() < 0.5 THEN 'rate_limited'
          WHEN RANDOM() < 0.8 THEN 'temporarily_blocked'
          ELSE 'logged'
        END,
        NULL,
        CASE WHEN RANDOM() < 0.5 THEN true ELSE false END,
        now() - (FLOOR(RANDOM() * 7)::INTEGER || ' days')::INTERVAL
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Successfully populated sending limits demo data for % users', user_count;
END $$;