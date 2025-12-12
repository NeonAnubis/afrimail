/*
  # Add Demo Audit Logs

  Populate audit logs with realistic admin actions:
  - User management actions (unlock, suspend, quota changes)
  - Support ticket resolutions
  - Announcement management
  - Email alias operations
  - Domain verifications
  - Password resets
  - System configuration changes
*/

-- Insert demo audit logs for various admin actions
INSERT INTO audit_logs (action_type, admin_email, target_user_email, details, ip_address, timestamp)
VALUES
  -- Recent actions (last 7 days)
  (
    'user_unlock',
    'admin@afrimail.com',
    'david.brown@afrimail.com',
    '{"reason": "User requested account unlock after failed login attempts", "previous_locked_until": "2025-12-10T00:00:00Z"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'quota_update',
    'admin@afrimail.com',
    'emma.jones@afrimail.com',
    '{"previous_quota": 1073741824, "new_quota": 5368709120, "reason": "Support ticket #2 - User requested storage upgrade"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '1 day'
  ),
  (
    'support_ticket_resolved',
    'admin@afrimail.com',
    'john.doe@afrimail.com',
    '{"ticket_id": "1", "subject": "Cannot access my mailbox", "resolution": "Password reset link sent"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '1 day'
  ),
  (
    'announcement_created',
    'admin@afrimail.com',
    NULL,
    '{"title": "Holiday Greetings", "target_group": "all", "priority": "low"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '1 day'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "contact@afrimail.com", "targets": ["admin@afrimail.com", "john.doe@afrimail.com"], "is_distribution_list": true}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '2 days'
  ),
  (
    'announcement_published',
    'admin@afrimail.com',
    NULL,
    '{"title": "Security Update: Enable 2FA", "target_group": "all", "priority": "high"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '3 days'
  ),
  (
    'support_ticket_resolved',
    'admin@afrimail.com',
    'emma.jones@afrimail.com',
    '{"ticket_id": "2", "subject": "Need more storage space", "resolution": "Upgraded user quota from 1GB to 5GB"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '3 days'
  ),
  (
    'email_alias_toggled',
    'admin@afrimail.com',
    NULL,
    '{"alias": "hr@afrimail.com", "action": "deactivated", "reason": "Inactive department"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '4 days'
  ),
  
  -- Actions from 1-2 weeks ago
  (
    'user_created',
    'admin@afrimail.com',
    'daniel.white@afrimail.com',
    '{"quota": 10737418240, "created_via": "admin_panel"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '8 days'
  ),
  (
    'password_reset',
    'admin@afrimail.com',
    'michael.johnson@afrimail.com',
    '{"method": "admin_initiated", "reason": "User forgot password"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '9 days'
  ),
  (
    'support_ticket_resolved',
    'admin@afrimail.com',
    'david.brown@afrimail.com',
    '{"ticket_id": "6", "subject": "Account locked", "resolution": "Account unlocked and password reset instructions sent"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '10 days'
  ),
  (
    'announcement_published',
    'admin@afrimail.com',
    NULL,
    '{"title": "New Feature: Email Aliases", "target_group": "all", "priority": "normal"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '12 days'
  ),
  (
    'domain_verified',
    'admin@afrimail.com',
    'john.doe@afrimail.com',
    '{"domain": "custom-john.doe.afrimail.com", "verification_method": "DNS"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '14 days'
  ),
  
  -- Actions from 2-4 weeks ago
  (
    'support_ticket_rejected',
    'admin@afrimail.com',
    'charles.thomas@afrimail.com',
    '{"ticket_id": "7", "subject": "Request for refund", "reason": "As per terms of service, no refunds for partial months"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '19 days'
  ),
  (
    'quota_update',
    'admin@afrimail.com',
    'sophia.moore@afrimail.com',
    '{"previous_quota": 5368709120, "new_quota": 10737418240, "reason": "Premium plan upgrade"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '20 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "hr@afrimail.com", "targets": ["sophia.moore@afrimail.com"], "is_distribution_list": false}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '22 days'
  ),
  (
    'announcement_published',
    'admin@afrimail.com',
    NULL,
    '{"title": "Increased Storage Limits", "target_group": "premium_users", "priority": "normal"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '25 days'
  ),
  (
    'system_settings_updated',
    'admin@afrimail.com',
    NULL,
    '{"setting": "domain_config", "changes": {"primary_domain": "afrimail.com"}}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '28 days'
  ),
  
  -- Actions from 1-2 months ago
  (
    'announcement_published',
    'admin@afrimail.com',
    NULL,
    '{"title": "Welcome to Afrimail!", "target_group": "all", "priority": "high"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '30 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "marketing@afrimail.com", "targets": ["olivia.miller@afrimail.com"], "is_distribution_list": false}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '32 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "tech@afrimail.com", "targets": ["james.davis@afrimail.com", "william.wilson@afrimail.com"], "is_distribution_list": true}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '35 days'
  ),
  (
    'quota_update',
    'admin@afrimail.com',
    'james.davis@afrimail.com',
    '{"previous_quota": 1073741824, "new_quota": 5368709120, "reason": "Standard plan upgrade"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '38 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "billing@afrimail.com", "targets": ["emma.jones@afrimail.com"], "is_distribution_list": false}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '40 days'
  ),
  (
    'user_created',
    'admin@afrimail.com',
    'mia.jackson@afrimail.com',
    '{"quota": 5368709120, "created_via": "admin_panel"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '42 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "noreply@afrimail.com", "targets": ["admin@afrimail.com"], "is_distribution_list": false}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '45 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "team@afrimail.com", "targets": ["john.doe@afrimail.com", "jane.smith@afrimail.com", "michael.johnson@afrimail.com", "sarah.williams@afrimail.com"], "is_distribution_list": true}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '50 days'
  ),
  (
    'user_created',
    'admin@afrimail.com',
    'charles.thomas@afrimail.com',
    '{"quota": 5368709120, "created_via": "admin_panel"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '52 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "sales@afrimail.com", "targets": ["michael.johnson@afrimail.com", "sarah.williams@afrimail.com"], "is_distribution_list": true}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '55 days'
  ),
  (
    'quota_preset_updated',
    'admin@afrimail.com',
    NULL,
    '{"presets": [{"name": "Basic", "value": 1073741824}, {"name": "Standard", "value": 5368709120}, {"name": "Premium", "value": 10737418240}, {"name": "Business", "value": 26843545600}]}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '58 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "support@afrimail.com", "targets": ["john.doe@afrimail.com", "jane.smith@afrimail.com"], "is_distribution_list": true}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '60 days'
  ),
  (
    'email_alias_created',
    'admin@afrimail.com',
    NULL,
    '{"alias": "info@afrimail.com", "targets": ["admin@afrimail.com"], "is_distribution_list": false}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '60 days'
  ),
  (
    'user_created',
    'admin@afrimail.com',
    'ava.anderson@afrimail.com',
    '{"quota": 5368709120, "created_via": "admin_panel"}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '65 days'
  ),
  (
    'system_configuration',
    'admin@afrimail.com',
    NULL,
    '{"action": "initial_setup", "domain": "afrimail.com", "settings_configured": ["domain_config", "quota_presets", "security_settings"]}'::jsonb,
    '197.234.52.18',
    NOW() - INTERVAL '90 days'
  );

-- Create index on timestamp for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_desc ON audit_logs(timestamp DESC);
