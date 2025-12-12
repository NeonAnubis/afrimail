/*
  # Populate Demo Data for Afrimail (Corrected)

  Demo Content:
  - Admin user (admin@afrimail.com / Admin123!)
  - 15 regular users with afrimail.com emails  
  - Email aliases and distribution lists
  - Support tickets (pending, in_progress, resolved, rejected)
  - System announcements
  - Mailbox metadata with varied usage
  - Activity logs
  - Custom domains
*/

-- Insert demo admin user (Password: Admin123!)
INSERT INTO admin_users (email, password_hash, name, created_at, last_login)
VALUES (
  'admin@afrimail.com',
  '$2a$10$rQ8YvzKz5ZKGJxKH4vXQ3e7YqXKJ5pZH5tXKJ5pZH5tXKJ5pZH5tX',
  'System Administrator',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '2 hours'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;

-- Insert demo regular users
DO $$
DECLARE
  user_emails TEXT[] := ARRAY[
    'john.doe@afrimail.com',
    'jane.smith@afrimail.com',
    'michael.johnson@afrimail.com',
    'sarah.williams@afrimail.com',
    'david.brown@afrimail.com',
    'emma.jones@afrimail.com',
    'james.davis@afrimail.com',
    'olivia.miller@afrimail.com',
    'william.wilson@afrimail.com',
    'sophia.moore@afrimail.com',
    'robert.taylor@afrimail.com',
    'ava.anderson@afrimail.com',
    'charles.thomas@afrimail.com',
    'mia.jackson@afrimail.com',
    'daniel.white@afrimail.com'
  ];
  first_names TEXT[] := ARRAY[
    'John', 'Jane', 'Michael', 'Sarah', 'David',
    'Emma', 'James', 'Olivia', 'William', 'Sophia',
    'Robert', 'Ava', 'Charles', 'Mia', 'Daniel'
  ];
  last_names TEXT[] := ARRAY[
    'Doe', 'Smith', 'Johnson', 'Williams', 'Brown',
    'Jones', 'Davis', 'Miller', 'Wilson', 'Moore',
    'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White'
  ];
  user_id UUID;
  i INT;
BEGIN
  FOR i IN 1..15 LOOP
    INSERT INTO users_extended (
      email,
      first_name,
      last_name,
      created_at,
      last_login,
      failed_login_attempts
    )
    VALUES (
      user_emails[i],
      first_names[i],
      last_names[i],
      NOW() - INTERVAL '1 day' * (90 - (i * 5)),
      CASE 
        WHEN i <= 10 THEN NOW() - INTERVAL '1 day' * i
        ELSE NULL
      END,
      0
    )
    ON CONFLICT (email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name
    RETURNING id INTO user_id;

    -- Add mailbox metadata
    INSERT INTO mailbox_metadata (
      user_id,
      email,
      quota_bytes,
      usage_bytes,
      last_sync
    )
    VALUES (
      user_id,
      user_emails[i],
      CASE 
        WHEN i <= 5 THEN 1073741824    -- 1GB
        WHEN i <= 10 THEN 5368709120   -- 5GB
        ELSE 10737418240               -- 10GB
      END,
      CASE 
        WHEN i = 1 THEN 1000000000     -- 93% usage
        WHEN i = 2 THEN 900000000      -- 84% usage
        WHEN i = 3 THEN 500000000      -- 46% usage
        WHEN i <= 8 THEN (i * 100000000)
        ELSE (i * 50000000)
      END,
      NOW() - INTERVAL '1 hour' * i
    )
    ON CONFLICT (email) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      quota_bytes = EXCLUDED.quota_bytes,
      usage_bytes = EXCLUDED.usage_bytes,
      last_sync = EXCLUDED.last_sync;
  END LOOP;
END $$;

-- Insert email aliases
INSERT INTO email_aliases (alias_address, target_addresses, active, is_distribution_list, description, created_at)
VALUES
  ('info@afrimail.com', ARRAY['admin@afrimail.com'], true, false, 'General inquiries', NOW() - INTERVAL '60 days'),
  ('support@afrimail.com', ARRAY['john.doe@afrimail.com', 'jane.smith@afrimail.com'], true, true, 'Support team distribution list', NOW() - INTERVAL '60 days'),
  ('sales@afrimail.com', ARRAY['michael.johnson@afrimail.com', 'sarah.williams@afrimail.com'], true, true, 'Sales team distribution list', NOW() - INTERVAL '55 days'),
  ('team@afrimail.com', ARRAY['john.doe@afrimail.com', 'jane.smith@afrimail.com', 'michael.johnson@afrimail.com', 'sarah.williams@afrimail.com'], true, true, 'All team members', NOW() - INTERVAL '50 days'),
  ('noreply@afrimail.com', ARRAY['admin@afrimail.com'], true, false, 'Automated emails', NOW() - INTERVAL '45 days'),
  ('billing@afrimail.com', ARRAY['emma.jones@afrimail.com'], true, false, 'Billing inquiries', NOW() - INTERVAL '40 days'),
  ('tech@afrimail.com', ARRAY['james.davis@afrimail.com', 'william.wilson@afrimail.com'], true, true, 'Technical team', NOW() - INTERVAL '35 days'),
  ('marketing@afrimail.com', ARRAY['olivia.miller@afrimail.com'], true, false, 'Marketing inquiries', NOW() - INTERVAL '30 days'),
  ('hr@afrimail.com', ARRAY['sophia.moore@afrimail.com'], false, false, 'Human resources (inactive)', NOW() - INTERVAL '25 days'),
  ('contact@afrimail.com', ARRAY['admin@afrimail.com', 'john.doe@afrimail.com'], true, true, 'General contact', NOW() - INTERVAL '20 days')
ON CONFLICT (alias_address) DO NOTHING;

-- Insert support tickets
INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at, resolved_at, resolution_notes)
SELECT 
  ue.id,
  ue.email,
  'Cannot access my mailbox',
  'I am having trouble logging into my email account. It keeps saying invalid credentials even though I am sure my password is correct.',
  'resolved',
  'high',
  'password_reset',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '9 days',
  'Password reset link sent to user. Issue resolved.'
FROM users_extended ue WHERE ue.email = 'john.doe@afrimail.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at, resolved_at, resolution_notes)
SELECT 
  ue.id,
  ue.email,
  'Need more storage space',
  'My mailbox is almost full. Can I get additional storage allocated to my account?',
  'resolved',
  'normal',
  'quota_increase',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '7 days',
  'Upgraded user quota from 1GB to 5GB.'
FROM users_extended ue WHERE ue.email = 'emma.jones@afrimail.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at)
SELECT 
  ue.id,
  ue.email,
  'Email forwarding not working',
  'I set up email forwarding to my personal email but messages are not being forwarded.',
  'pending',
  'high',
  'general',
  NOW() - INTERVAL '3 days'
FROM users_extended ue WHERE ue.email = 'sarah.williams@afrimail.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at)
SELECT 
  ue.id,
  ue.email,
  'Question about email aliases',
  'How do I create an email alias for my account?',
  'pending',
  'normal',
  'general',
  NOW() - INTERVAL '2 days'
FROM users_extended ue WHERE ue.email = 'michael.johnson@afrimail.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at)
SELECT 
  ue.id,
  ue.email,
  'Spam emails in inbox',
  'I am receiving a lot of spam emails. Can you improve the spam filtering?',
  'in_progress',
  'low',
  'general',
  NOW() - INTERVAL '1 day'
FROM users_extended ue WHERE ue.email = 'olivia.miller@afrimail.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at, resolved_at, resolution_notes)
SELECT 
  ue.id,
  ue.email,
  'Account locked',
  'My account was locked after multiple failed login attempts. Please unlock it.',
  'resolved',
  'high',
  'account_unlock',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days',
  'Account unlocked and password reset instructions sent.'
FROM users_extended ue WHERE ue.email = 'david.brown@afrimail.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (user_id, user_email, subject, message, status, priority, ticket_type, created_at, resolved_at, resolution_notes)
SELECT 
  ue.id,
  ue.email,
  'Request for refund',
  'I want to cancel my account and get a refund for the remaining period.',
  'rejected',
  'normal',
  'general',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '19 days',
  'As per our terms of service, refunds are not provided for partial months.'
FROM users_extended ue WHERE ue.email = 'charles.thomas@afrimail.com'
ON CONFLICT DO NOTHING;

-- Insert announcements
INSERT INTO announcements (title, message, target_group, priority, published, published_at, created_by, created_at, expires_at)
VALUES
  (
    'Welcome to Afrimail!',
    'We are excited to have you on board. Afrimail provides secure and reliable email services for professionals across Africa.',
    'all',
    'high',
    true,
    NOW() - INTERVAL '30 days',
    'admin',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days'
  ),
  (
    'Scheduled Maintenance - December 15th',
    'Our email servers will undergo scheduled maintenance on December 15th from 2:00 AM to 4:00 AM GMT. Email services may be temporarily unavailable during this period.',
    'all',
    'high',
    true,
    NOW() - INTERVAL '5 days',
    'admin',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '10 days'
  ),
  (
    'New Feature: Email Aliases',
    'You can now create custom email aliases for your account! Visit your dashboard to set up aliases and manage them easily.',
    'all',
    'normal',
    true,
    NOW() - INTERVAL '15 days',
    'admin',
    NOW() - INTERVAL '15 days',
    NULL
  ),
  (
    'Increased Storage Limits',
    'We have increased the default storage limit for all premium users from 5GB to 10GB at no extra cost. Enjoy the extra space!',
    'premium_users',
    'normal',
    true,
    NOW() - INTERVAL '25 days',
    'admin',
    NOW() - INTERVAL '25 days',
    NULL
  ),
  (
    'Security Update: Enable 2FA',
    'Protect your account by enabling two-factor authentication. Visit your security settings to set it up today.',
    'all',
    'high',
    true,
    NOW() - INTERVAL '12 days',
    'admin',
    NOW() - INTERVAL '12 days',
    NOW() + INTERVAL '30 days'
  ),
  (
    'Holiday Greetings',
    'Wishing all our users a wonderful holiday season! Our support team will have limited availability from Dec 24-26.',
    'all',
    'low',
    false,
    NULL,
    'admin',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '20 days'
  )
ON CONFLICT DO NOTHING;

-- Insert activity logs
DO $$
DECLARE
  user_record RECORD;
  activity_types TEXT[] := ARRAY['login', 'password_change', 'settings_update', 'email_sent', 'email_received'];
  i INT;
BEGIN
  FOR user_record IN SELECT id, email FROM users_extended WHERE last_login IS NOT NULL AND email LIKE '%@afrimail.com' LIMIT 10 LOOP
    FOR i IN 1..FLOOR(RANDOM() * 10 + 5)::INT LOOP
      INSERT INTO activity_logs (
        user_id,
        activity_type,
        description,
        ip_address,
        user_agent,
        created_at
      )
      VALUES (
        user_record.id,
        activity_types[FLOOR(RANDOM() * 5 + 1)::INT],
        'User activity from ' || user_record.email,
        '197.234.' || FLOOR(RANDOM() * 255)::TEXT || '.' || FLOOR(RANDOM() * 255)::TEXT,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30)::INT
      );
    END LOOP;
  END LOOP;
END $$;

-- Insert domain configuration
INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
VALUES
  (
    'domain_config',
    '{"primary_domain": "afrimail.com", "allowed_domains": ["afrimail.com"], "default_domain": "afrimail.com"}'::jsonb,
    'Domain configuration for the mail system',
    NOW()
  )
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = EXCLUDED.updated_at;

-- Add some custom domains
DO $$
DECLARE
  user_record RECORD;
  custom_domain TEXT;
BEGIN
  FOR user_record IN SELECT id, email FROM users_extended WHERE email LIKE '%@afrimail.com' LIMIT 5 LOOP
    custom_domain := 'custom-' || SPLIT_PART(user_record.email, '@', 1) || '.afrimail.com';
    
    INSERT INTO custom_domains (domain, user_id, verification_status, created_at, verified_at)
    VALUES (
      custom_domain,
      user_record.id,
      CASE 
        WHEN RANDOM() < 0.7 THEN 'verified'
        ELSE 'pending'
      END,
      NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 60)::INT,
      CASE 
        WHEN RANDOM() < 0.7 THEN NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 50)::INT
        ELSE NULL
      END
    )
    ON CONFLICT (domain) DO NOTHING;
  END LOOP;
END $$;
