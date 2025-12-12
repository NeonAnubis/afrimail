/*
  # Create Admin Roles and Permissions System

  1. New Tables
    - `admin_roles`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Role name (e.g., "Super Admin", "User Manager", "Support Manager")
      - `description` (text) - Role description
      - `permissions` (jsonb) - JSON object containing permissions
      - `is_system_role` (boolean) - Whether this is a built-in system role
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `role_id` column to `admin_users` table
    - Add `is_active` column to `admin_users` table
    - Add `created_by` column to `admin_users` table

  3. Security
    - Enable RLS on `admin_roles` table
    - Add policies for authenticated admins to read roles
    - Only super admins can modify roles

  4. Default Roles
    - Super Admin: Full system access
    - User Manager: User and mailbox management
    - Support Manager: Support tickets and announcements
    - Storage Manager: Storage and quota management
    - Domain Manager: Domain and alias management
    - Audit Viewer: Read-only access to audit logs
*/

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns to admin_users if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role_id uuid REFERENCES admin_roles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN created_by uuid REFERENCES admin_users(id);
  END IF;
END $$;

-- Enable RLS on admin_roles
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_roles
CREATE POLICY "Admins can read roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.name = 'Super Admin'
    )
  );

CREATE POLICY "Super admins can update roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.name = 'Super Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.name = 'Super Admin'
    )
  );

CREATE POLICY "Super admins can delete non-system roles"
  ON admin_roles FOR DELETE
  TO authenticated
  USING (
    NOT is_system_role
    AND EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.name = 'Super Admin'
    )
  );

-- Insert default roles
INSERT INTO admin_roles (name, description, permissions, is_system_role) VALUES
  (
    'Super Admin',
    'Full system access with all permissions',
    '{
      "users": {"view": true, "create": true, "edit": true, "delete": true, "suspend": true},
      "admins": {"view": true, "create": true, "edit": true, "delete": true},
      "roles": {"view": true, "create": true, "edit": true, "delete": true},
      "storage": {"view": true, "edit": true},
      "domains": {"view": true, "create": true, "edit": true, "delete": true},
      "aliases": {"view": true, "create": true, "edit": true, "delete": true},
      "support": {"view": true, "edit": true, "delete": true},
      "announcements": {"view": true, "create": true, "edit": true, "delete": true},
      "audit_logs": {"view": true},
      "settings": {"view": true, "edit": true}
    }'::jsonb,
    true
  ),
  (
    'User Manager',
    'Manage user accounts and mailboxes',
    '{
      "users": {"view": true, "create": true, "edit": true, "delete": false, "suspend": true},
      "storage": {"view": true, "edit": true},
      "audit_logs": {"view": true}
    }'::jsonb,
    true
  ),
  (
    'Support Manager',
    'Handle support tickets and announcements',
    '{
      "users": {"view": true, "create": false, "edit": false, "delete": false, "suspend": false},
      "support": {"view": true, "edit": true, "delete": false},
      "announcements": {"view": true, "create": true, "edit": true, "delete": true},
      "audit_logs": {"view": true}
    }'::jsonb,
    true
  ),
  (
    'Storage Manager',
    'Manage storage quotas and monitor usage',
    '{
      "users": {"view": true, "create": false, "edit": false, "delete": false, "suspend": false},
      "storage": {"view": true, "edit": true},
      "audit_logs": {"view": true}
    }'::jsonb,
    true
  ),
  (
    'Domain Manager',
    'Manage domains and email aliases',
    '{
      "domains": {"view": true, "create": true, "edit": true, "delete": true},
      "aliases": {"view": true, "create": true, "edit": true, "delete": true},
      "audit_logs": {"view": true}
    }'::jsonb,
    true
  ),
  (
    'Audit Viewer',
    'Read-only access to system audit logs and reports',
    '{
      "users": {"view": true, "create": false, "edit": false, "delete": false, "suspend": false},
      "storage": {"view": true, "edit": false},
      "domains": {"view": true, "create": false, "edit": false, "delete": false},
      "aliases": {"view": true, "create": false, "edit": false, "delete": false},
      "support": {"view": true, "edit": false, "delete": false},
      "announcements": {"view": true, "create": false, "edit": false, "delete": false},
      "audit_logs": {"view": true}
    }'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Update existing admin users to have Super Admin role
UPDATE admin_users
SET role_id = (SELECT id FROM admin_roles WHERE name = 'Super Admin')
WHERE role_id IS NULL;