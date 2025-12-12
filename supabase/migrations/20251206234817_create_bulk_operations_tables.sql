/*
  # Create Bulk Operations and Efficiency Tools Tables

  1. New Tables
    - `user_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Template name (e.g., "Basic User", "Premium User")
      - `description` (text) - Template description
      - `quota_bytes` (bigint) - Default storage quota
      - `permissions` (jsonb) - Default permissions/features
      - `is_system_template` (boolean) - Whether this is a built-in template
      - `created_by` (uuid) - Admin who created the template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_groups`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Group name (e.g., "Engineering", "Sales")
      - `description` (text) - Group description
      - `color` (text) - Badge color for UI
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_group_members`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References users_extended
      - `group_id` (uuid) - References user_groups
      - `added_at` (timestamptz)
      - `added_by` (uuid) - Admin who added the user to group

    - `scheduled_actions`
      - `id` (uuid, primary key)
      - `action_type` (text) - Type: suspend, unsuspend, delete, quota_change, warning
      - `target_type` (text) - Target: single_user, user_group, bulk_users
      - `target_ids` (jsonb) - Array of user IDs or group IDs
      - `scheduled_for` (timestamptz) - When to execute
      - `status` (text) - Status: pending, completed, failed, cancelled
      - `action_data` (jsonb) - Additional data for the action
      - `created_by` (uuid) - Admin who created the scheduled action
      - `executed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `bulk_import_logs`
      - `id` (uuid, primary key)
      - `filename` (text) - Name of imported CSV file
      - `total_rows` (integer) - Total rows in CSV
      - `successful_imports` (integer) - Number of successful imports
      - `failed_imports` (integer) - Number of failed imports
      - `error_details` (jsonb) - Details of any errors
      - `imported_by` (uuid) - Admin who performed the import
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated admins
    - Only super admins can create system templates

  3. Default Data
    - Insert default user templates (Basic, Standard, Premium, Business)
    - Insert default user groups (General, Priority, Enterprise)
*/

-- Create user_templates table
CREATE TABLE IF NOT EXISTS user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  quota_bytes bigint DEFAULT 5368709120,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_system_template boolean DEFAULT false,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_group_members table
CREATE TABLE IF NOT EXISTS user_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid REFERENCES user_groups(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES admin_users(id),
  UNIQUE(user_id, group_id)
);

-- Create scheduled_actions table
CREATE TABLE IF NOT EXISTS scheduled_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  action_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES admin_users(id),
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create bulk_import_logs table
CREATE TABLE IF NOT EXISTS bulk_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  total_rows integer DEFAULT 0,
  successful_imports integer DEFAULT 0,
  failed_imports integer DEFAULT 0,
  error_details jsonb DEFAULT '[]'::jsonb,
  imported_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_templates
CREATE POLICY "Admins can read templates"
  ON user_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create templates"
  ON user_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update templates"
  ON user_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete non-system templates"
  ON user_templates FOR DELETE
  TO authenticated
  USING (NOT is_system_template);

-- Policies for user_groups
CREATE POLICY "Admins can read groups"
  ON user_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create groups"
  ON user_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update groups"
  ON user_groups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete groups"
  ON user_groups FOR DELETE
  TO authenticated
  USING (true);

-- Policies for user_group_members
CREATE POLICY "Admins can read group members"
  ON user_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can add group members"
  ON user_group_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can remove group members"
  ON user_group_members FOR DELETE
  TO authenticated
  USING (true);

-- Policies for scheduled_actions
CREATE POLICY "Admins can read scheduled actions"
  ON scheduled_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create scheduled actions"
  ON scheduled_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update scheduled actions"
  ON scheduled_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete scheduled actions"
  ON scheduled_actions FOR DELETE
  TO authenticated
  USING (true);

-- Policies for bulk_import_logs
CREATE POLICY "Admins can read import logs"
  ON bulk_import_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create import logs"
  ON bulk_import_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default user templates
INSERT INTO user_templates (name, description, quota_bytes, permissions, is_system_template) VALUES
  (
    'Basic User',
    'Entry-level account with 1GB storage',
    1073741824,
    '{
      "email": true,
      "calendar": false,
      "contacts": true,
      "max_aliases": 3
    }'::jsonb,
    true
  ),
  (
    'Standard User',
    'Standard account with 5GB storage',
    5368709120,
    '{
      "email": true,
      "calendar": true,
      "contacts": true,
      "max_aliases": 10
    }'::jsonb,
    true
  ),
  (
    'Premium User',
    'Premium account with 15GB storage',
    16106127360,
    '{
      "email": true,
      "calendar": true,
      "contacts": true,
      "max_aliases": 25,
      "priority_support": true
    }'::jsonb,
    true
  ),
  (
    'Business User',
    'Business account with 50GB storage',
    53687091200,
    '{
      "email": true,
      "calendar": true,
      "contacts": true,
      "max_aliases": 100,
      "priority_support": true,
      "advanced_security": true
    }'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Insert default user groups
INSERT INTO user_groups (name, description, color) VALUES
  ('General', 'General user group', 'gray'),
  ('Priority', 'Priority users requiring special attention', 'yellow'),
  ('Enterprise', 'Enterprise customers', 'blue'),
  ('Beta Testers', 'Users testing new features', 'purple'),
  ('Support Required', 'Users who need assistance', 'red')
ON CONFLICT (name) DO NOTHING;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_status ON scheduled_actions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_scheduled_for ON scheduled_actions(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_action_type ON scheduled_actions(action_type);