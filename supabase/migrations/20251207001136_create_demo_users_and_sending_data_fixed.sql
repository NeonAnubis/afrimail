/*
  # Create Demo Users and Sending Limits Data

  1. Demo Users
    - Creates 25 demo users in auth.users
    - Creates corresponding users_extended entries
    - Creates mailbox_metadata entries

  2. Sending Limits Data
    - Assigns various tiers to users
    - Sets different usage levels (low, medium, high, at-limit, over-limit)
    - Creates realistic email send logs
    - Generates violations for some users

  3. Data Distribution
    - 12 users on free tier (various usage levels)
    - 6 users on basic tier
    - 4 users on premium tier
    - 3 users on enterprise tier
    - Some users at/near limits
    - Some violations for testing
*/

DO $$
DECLARE
  user_id uuid;
  user_email text;
  user_number integer;
  tier_name text;
  daily_limit integer;
  emails_sent integer;
  is_at_limit boolean;
  is_suspended boolean;
  log_count integer;
  i integer;
  log_date timestamptz;
  violation_chance float;
BEGIN
  -- Create 25 demo users with sending limits
  FOR user_number IN 1..25 LOOP
    user_email := 'user' || user_number || '@example.com';
    user_id := gen_random_uuid();
    
    -- Determine tier and limits based on user number
    IF user_number <= 12 THEN
      tier_name := 'free';
      daily_limit := 50;
      -- Vary the usage: some low, some high, some at limit
      IF user_number <= 3 THEN
        emails_sent := daily_limit + FLOOR(RANDOM() * 10)::integer;
        is_at_limit := true;
      ELSIF user_number <= 6 THEN
        emails_sent := FLOOR(daily_limit * (0.85 + RANDOM() * 0.15))::integer;
        is_at_limit := false;
      ELSIF user_number <= 9 THEN
        emails_sent := FLOOR(daily_limit * (0.5 + RANDOM() * 0.3))::integer;
        is_at_limit := false;
      ELSE
        emails_sent := FLOOR(daily_limit * RANDOM() * 0.4)::integer;
        is_at_limit := false;
      END IF;
    ELSIF user_number <= 18 THEN
      tier_name := 'basic';
      daily_limit := 500;
      IF user_number = 13 THEN
        emails_sent := FLOOR(daily_limit * 0.95)::integer;
        is_at_limit := false;
      ELSIF user_number = 14 THEN
        emails_sent := daily_limit;
        is_at_limit := true;
      ELSE
        emails_sent := FLOOR(daily_limit * (0.3 + RANDOM() * 0.5))::integer;
        is_at_limit := false;
      END IF;
    ELSIF user_number <= 22 THEN
      tier_name := 'premium';
      daily_limit := 2000;
      emails_sent := FLOOR(daily_limit * (0.2 + RANDOM() * 0.6))::integer;
      is_at_limit := false;
    ELSE
      tier_name := 'enterprise';
      daily_limit := 999999;
      emails_sent := FLOOR(1000 + RANDOM() * 3000)::integer;
      is_at_limit := false;
    END IF;
    
    -- Some users should be suspended (10% chance)
    is_suspended := RANDOM() < 0.1;
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      aud,
      role
    ) VALUES (
      user_id,
      user_email,
      crypt('password123', gen_salt('bf')),
      now(),
      now() - (FLOOR(RANDOM() * 90)::integer || ' days')::interval,
      now(),
      '',
      'authenticated',
      'authenticated'
    );
    
    -- Insert into users_extended
    INSERT INTO users_extended (
      email,
      first_name,
      last_name,
      recovery_email,
      recovery_phone,
      is_suspended,
      created_at,
      updated_at
    ) VALUES (
      user_email,
      'Demo User',
      user_number::text,
      'recovery' || user_number || '@example.com',
      '+1555000' || LPAD(user_number::text, 4, '0'),
      is_suspended,
      now() - (FLOOR(RANDOM() * 90)::integer || ' days')::interval,
      now()
    );
    
    -- Insert mailbox metadata
    INSERT INTO mailbox_metadata (
      email,
      quota_bytes,
      usage_bytes,
      last_synced
    ) VALUES (
      user_email,
      CASE 
        WHEN tier_name = 'free' THEN 1073741824
        WHEN tier_name = 'basic' THEN 5368709120
        WHEN tier_name = 'premium' THEN 10737418240
        ELSE 26843545600
      END,
      FLOOR(RANDOM() * 1000000000)::bigint,
      now()
    );
    
    -- Insert email sending limit
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
      user_id,
      tier_name,
      daily_limit,
      CASE 
        WHEN tier_name = 'free' THEN 10
        WHEN tier_name = 'basic' THEN 50
        WHEN tier_name = 'premium' THEN 200
        ELSE 99999
      END,
      LEAST(emails_sent, daily_limit),
      FLOOR(RANDOM() * 10)::integer,
      CURRENT_DATE,
      date_trunc('hour', now()),
      NOT is_suspended,
      CASE WHEN is_suspended THEN 'Suspended for suspicious activity' ELSE NULL END
    );
    
    -- Create email send logs for the past 30 days
    log_count := LEAST(emails_sent, 100);
    FOR i IN 1..log_count LOOP
      log_date := now() - (FLOOR(RANDOM() * 30)::integer || ' days')::interval - (FLOOR(RANDOM() * 24)::integer || ' hours')::interval;
      
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
        user_id,
        'recipient' || FLOOR(RANDOM() * 1000) || '@example.com',
        1,
        CASE FLOOR(RANDOM() * 6)
          WHEN 0 THEN 'Welcome to Our Service'
          WHEN 1 THEN 'Monthly Newsletter - ' || to_char(now(), 'Month YYYY')
          WHEN 2 THEN 'Account Security Alert'
          WHEN 3 THEN 'Your Order Confirmation #' || FLOOR(RANDOM() * 10000)
          WHEN 4 THEN 'Password Reset Request'
          ELSE 'Important Update'
        END,
        CASE 
          WHEN RANDOM() < 0.92 THEN 'sent'
          WHEN RANDOM() < 0.96 THEN 'failed'
          ELSE 'blocked'
        END,
        CASE WHEN RANDOM() < 0.04 THEN 'Invalid recipient address' ELSE NULL END,
        CASE WHEN RANDOM() < 0.02 THEN 'Spam filter triggered' ELSE NULL END,
        ('192.168.' || FLOOR(RANDOM() * 255) || '.' || FLOOR(RANDOM() * 255))::inet,
        log_date,
        log_date
      );
    END LOOP;
    
    -- Create violations for users who exceeded or are near limits
    violation_chance := CASE 
      WHEN is_at_limit THEN 0.8
      WHEN emails_sent >= daily_limit * 0.85 THEN 0.4
      ELSE 0.1
    END;
    
    IF RANDOM() < violation_chance THEN
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
        created_at
      ) VALUES (
        user_id,
        CASE FLOOR(RANDOM() * 4)
          WHEN 0 THEN 'exceeded_daily_limit'
          WHEN 1 THEN 'suspicious_pattern'
          WHEN 2 THEN 'rapid_sending'
          ELSE 'spam_complaint'
        END,
        emails_sent,
        daily_limit,
        jsonb_build_object(
          'detection_method', 'automated',
          'spike_detected', true,
          'previous_average', FLOOR(daily_limit * 0.3),
          'spike_percentage', FLOOR(((emails_sent::float / (daily_limit * 0.3)) - 1) * 100)
        ),
        CASE FLOOR(RANDOM() * 3)
          WHEN 0 THEN 'rate_limited'
          WHEN 1 THEN 'temporarily_blocked'
          ELSE 'logged_only'
        END,
        CASE WHEN RANDOM() < 0.5 THEN 'Reviewed and approved normal usage pattern' ELSE NULL END,
        RANDOM() < 0.6,
        CASE WHEN RANDOM() < 0.6 THEN now() - (FLOOR(RANDOM() * 5)::integer || ' days')::interval ELSE NULL END,
        now() - (FLOOR(RANDOM() * 14)::integer || ' days')::interval
      );
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Successfully created 25 demo users with sending limits data';
END $$;