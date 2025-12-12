/*
  # Populate User Group Members with Demo Data

  This migration populates the user_group_members table with realistic demo data,
  assigning the existing demo users to the predefined user groups.

  1. Data Distribution
    - General group: 15 members (mixed users from all tiers)
    - Priority group: 5 members (higher tier users)
    - Enterprise group: 8 members (premium/enterprise users)
    - Beta Testers group: 10 members (various users)
    - Support Required group: 3 members (users with issues)

  2. Notes
    - Some users belong to multiple groups (realistic scenario)
    - Uses existing demo users (user1@example.com through user25@example.com)
    - Varies the added_at dates to simulate historical data
    - Some groups have overlapping membership

  3. Security
    - All operations respect existing RLS policies
    - No sensitive data is exposed
*/

DO $$
DECLARE
  general_group_id uuid;
  priority_group_id uuid;
  enterprise_group_id uuid;
  beta_group_id uuid;
  support_group_id uuid;
  user_rec record;
  random_days integer;
BEGIN
  -- Get group IDs
  SELECT id INTO general_group_id FROM user_groups WHERE name = 'General' LIMIT 1;
  SELECT id INTO priority_group_id FROM user_groups WHERE name = 'Priority' LIMIT 1;
  SELECT id INTO enterprise_group_id FROM user_groups WHERE name = 'Enterprise' LIMIT 1;
  SELECT id INTO beta_group_id FROM user_groups WHERE name = 'Beta Testers' LIMIT 1;
  SELECT id INTO support_group_id FROM user_groups WHERE name = 'Support Required' LIMIT 1;

  -- Check if groups exist
  IF general_group_id IS NULL OR priority_group_id IS NULL OR 
     enterprise_group_id IS NULL OR beta_group_id IS NULL OR 
     support_group_id IS NULL THEN
    RAISE NOTICE 'Some groups not found, skipping member population';
    RETURN;
  END IF;

  -- Assign users to General group (users 1-15)
  FOR user_rec IN 
    SELECT id FROM users_extended 
    WHERE email SIMILAR TO 'user(1[0-5]|[1-9])@example.com'
    LIMIT 15
  LOOP
    random_days := FLOOR(RANDOM() * 60)::integer;
    INSERT INTO user_group_members (user_id, group_id, added_at)
    VALUES (
      user_rec.id, 
      general_group_id,
      NOW() - (random_days || ' days')::interval
    )
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END LOOP;

  -- Assign users to Priority group (users 16-20, high-value users)
  FOR user_rec IN 
    SELECT id FROM users_extended 
    WHERE email SIMILAR TO 'user(1[6-9]|20)@example.com'
    LIMIT 5
  LOOP
    random_days := FLOOR(RANDOM() * 30)::integer;
    INSERT INTO user_group_members (user_id, group_id, added_at)
    VALUES (
      user_rec.id, 
      priority_group_id,
      NOW() - (random_days || ' days')::interval
    )
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END LOOP;

  -- Assign users to Enterprise group (users 18-25, premium users)
  FOR user_rec IN 
    SELECT id FROM users_extended 
    WHERE email SIMILAR TO 'user(1[8-9]|2[0-5])@example.com'
    LIMIT 8
  LOOP
    random_days := FLOOR(RANDOM() * 45)::integer;
    INSERT INTO user_group_members (user_id, group_id, added_at)
    VALUES (
      user_rec.id, 
      enterprise_group_id,
      NOW() - (random_days || ' days')::interval
    )
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END LOOP;

  -- Assign users to Beta Testers group (users 5-14, mixed tier users)
  FOR user_rec IN 
    SELECT id FROM users_extended 
    WHERE email SIMILAR TO 'user([5-9]|1[0-4])@example.com'
    LIMIT 10
  LOOP
    random_days := FLOOR(RANDOM() * 20)::integer;
    INSERT INTO user_group_members (user_id, group_id, added_at)
    VALUES (
      user_rec.id, 
      beta_group_id,
      NOW() - (random_days || ' days')::interval
    )
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END LOOP;

  -- Assign users to Support Required group (users 1-3, users with potential issues)
  FOR user_rec IN 
    SELECT id FROM users_extended 
    WHERE email SIMILAR TO 'user[1-3]@example.com'
    LIMIT 3
  LOOP
    random_days := FLOOR(RANDOM() * 10)::integer;
    INSERT INTO user_group_members (user_id, group_id, added_at)
    VALUES (
      user_rec.id, 
      support_group_id,
      NOW() - (random_days || ' days')::interval
    )
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Successfully populated user group members';
END $$;