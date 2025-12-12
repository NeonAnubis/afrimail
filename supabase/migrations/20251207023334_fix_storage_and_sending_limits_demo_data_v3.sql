/*
  # Fix Storage and Sending Limits Demo Data v3

  1. Purpose
    - Ensure mailbox_metadata has proper demo data for storage page
    - Add email_sending_limits demo data using auth.users table
    - Create realistic email send logs and violations

  2. Changes
    - Update existing mailbox_metadata entries
    - Create email_sending_limits for auth users
    - Generate sample email send logs with proper IP type casting
    - Create sample violations for testing

  3. Security
    - Uses existing demo user data
    - No sensitive information exposed
*/

-- First, ensure all demo users have mailbox metadata
DO $$
DECLARE
  user_rec RECORD;
  user_count INTEGER := 0;
BEGIN
  FOR user_rec IN (
    SELECT ue.id, ue.email 
    FROM users_extended ue
    ORDER BY ue.created_at 
    LIMIT 15
  )
  LOOP
    user_count := user_count + 1;
    
    INSERT INTO mailbox_metadata (
      user_id,
      email,
      quota_bytes,
      usage_bytes,
      last_sync
    )
    VALUES (
      user_rec.id,
      user_rec.email,
      CASE 
        WHEN user_count <= 5 THEN 1073741824    -- 1GB
        WHEN user_count <= 10 THEN 5368709120   -- 5GB
        ELSE 10737418240                         -- 10GB
      END,
      CASE 
        WHEN user_count = 1 THEN 1000000000     -- 93% usage
        WHEN user_count = 2 THEN 900000000      -- 84% usage
        WHEN user_count = 3 THEN 500000000      -- 46% usage
        WHEN user_count <= 8 THEN (user_count * 100000000)
        ELSE (user_count * 50000000)
      END,
      NOW() - (user_count || ' hours')::INTERVAL
    )
    ON CONFLICT (email) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      quota_bytes = EXCLUDED.quota_bytes,
      usage_bytes = EXCLUDED.usage_bytes,
      last_sync = EXCLUDED.last_sync;
  END LOOP;
  
  RAISE NOTICE 'Updated mailbox metadata for % users', user_count;
END $$;

-- Now create email sending limits using auth.users
DO $$
DECLARE
  user_rec RECORD;
  user_count INTEGER := 0;
  emails_sent INTEGER;
  tier TEXT;
  daily_limit INTEGER;
  i INTEGER;
  log_date TIMESTAMPTZ;
  ip_addr TEXT;
BEGIN
  FOR user_rec IN (
    SELECT id, email
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 20
  )
  LOOP
    user_count := user_count + 1;
    
    -- Assign tier based on user count for variety
    IF user_count <= 10 THEN
      tier := 'free';
      daily_limit := 50;
      emails_sent := CASE 
        WHEN user_count = 1 THEN 50  -- At limit
        WHEN user_count = 2 THEN 45  -- Near limit
        WHEN user_count = 3 THEN 42  -- Near limit
        ELSE FLOOR(RANDOM() * 35)::INTEGER
      END;
    ELSIF user_count <= 15 THEN
      tier := 'basic';
      daily_limit := 500;
      emails_sent := CASE
        WHEN user_count = 11 THEN 495  -- Near limit
        ELSE FLOOR(RANDOM() * 400)::INTEGER
      END;
    ELSIF user_count <= 18 THEN
      tier := 'premium';
      daily_limit := 2000;
      emails_sent := FLOOR(RANDOM() * 1500)::INTEGER;
    ELSE
      tier := 'enterprise';
      daily_limit := 999999;
      emails_sent := FLOOR(RANDOM() * 800)::INTEGER;
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
      user_rec.id,
      tier,
      daily_limit,
      CASE 
        WHEN tier = 'free' THEN 10
        WHEN tier = 'basic' THEN 50
        WHEN tier = 'premium' THEN 200
        ELSE 99999
      END,
      emails_sent,
      FLOOR(RANDOM() * 5)::INTEGER,
      CURRENT_DATE,
      date_trunc('hour', now()),
      CASE WHEN user_count = 5 THEN false ELSE true END,
      CASE WHEN user_count = 5 THEN 'Suspended for suspicious activity' ELSE NULL END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      tier_name = EXCLUDED.tier_name,
      daily_limit = EXCLUDED.daily_limit,
      hourly_limit = EXCLUDED.hourly_limit,
      emails_sent_today = EXCLUDED.emails_sent_today,
      emails_sent_this_hour = EXCLUDED.emails_sent_this_hour,
      last_reset_date = EXCLUDED.last_reset_date,
      last_reset_hour = EXCLUDED.last_reset_hour,
      is_sending_enabled = EXCLUDED.is_sending_enabled,
      custom_limit_reason = EXCLUDED.custom_limit_reason;

    -- Create email send logs for realistic data
    FOR i IN 1..LEAST(emails_sent, 25) LOOP
      log_date := now() - (FLOOR(RANDOM() * 30)::INTEGER || ' days')::INTERVAL - (FLOOR(RANDOM() * 24)::INTEGER || ' hours')::INTERVAL;
      ip_addr := '192.168.' || FLOOR(RANDOM() * 255)::TEXT || '.' || FLOOR(RANDOM() * 255)::TEXT;
      
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
        user_rec.id,
        'recipient' || FLOOR(RANDOM() * 1000) || '@example.com',
        1,
        CASE 
          WHEN RANDOM() < 0.3 THEN 'Monthly Newsletter'
          WHEN RANDOM() < 0.5 THEN 'Account Update'
          WHEN RANDOM() < 0.7 THEN 'Password Reset Request'
          ELSE 'Important Notification'
        END,
        CASE 
          WHEN RANDOM() < 0.92 THEN 'sent'
          WHEN RANDOM() < 0.97 THEN 'failed'
          ELSE 'blocked'
        END,
        CASE WHEN RANDOM() < 0.05 THEN 'Invalid recipient' ELSE NULL END,
        CASE WHEN RANDOM() < 0.02 THEN 'Spam detected' ELSE NULL END,
        ip_addr::inet,
        log_date,
        log_date
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Create violations for users at/near limits
    IF user_count IN (1, 2, 5) THEN
      INSERT INTO sending_limit_violations (
        user_id,
        violation_type,
        attempted_count,
        limit_at_time,
        violation_details,
        action_taken,
        admin_notes,
        is_resolved,
        resolved_at,
        resolved_by,
        created_at
      ) VALUES (
        user_rec.id,
        CASE 
          WHEN user_count = 1 THEN 'exceeded_daily_limit'
          WHEN user_count = 2 THEN 'suspicious_pattern'
          ELSE 'rapid_sending'
        END,
        daily_limit + 5,
        daily_limit,
        jsonb_build_object(
          'reason', 'Automated detection',
          'spike_detected', true,
          'previous_average', daily_limit / 2
        ),
        CASE 
          WHEN user_count = 1 THEN 'rate_limited'
          WHEN user_count = 2 THEN 'temporarily_blocked'
          ELSE 'account_suspended'
        END,
        CASE WHEN user_count = 1 THEN 'Resolved after user contacted support' ELSE NULL END,
        CASE WHEN user_count = 1 THEN true ELSE false END,
        CASE WHEN user_count = 1 THEN now() - INTERVAL '2 days' ELSE NULL END,
        CASE WHEN user_count = 1 THEN 'admin@afrimail.com' ELSE NULL END,
        now() - (FLOOR(RANDOM() * 5 + 1)::INTEGER || ' days')::INTERVAL
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Created sending limits data for % users', user_count;
END $$;
