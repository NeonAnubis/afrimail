export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  recovery_email?: string;
  recovery_phone?: string;
  is_suspended: boolean;
  last_login?: string;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role_id?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface MailboxInfo {
  email: string;
  quota_bytes: number;
  usage_bytes: number;
  quota_used_percentage: number;
}

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  recovery_email: string;
  recovery_phone: string;
  hcaptcha_token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface PasswordResetData {
  email: string;
  method: 'email' | 'sms';
}

export interface OTPVerifyData {
  email: string;
  otp_code: string;
}

export interface ResetPasswordData {
  email: string;
  otp_code: string;
  new_password: string;
}

export interface ChangePasswordData {
  email: string;
  old_password: string;
  new_password: string;
}

export interface RecoveryInfoUpdate {
  recovery_email: string;
  recovery_phone: string;
}

export interface Stats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  total_domains: number;
}

export interface StorageStats {
  total_allocated: number;
  total_used: number;
  average_usage_percent: number;
  users_over_90_percent: number;
}

export interface ActivityStats {
  active_last_7_days: number;
  active_last_30_days: number;
  never_logged_in: number;
}

export interface AuditLog {
  id: string;
  action_type: string;
  admin_email: string;
  target_user_email?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ticket_type: string;
  user_email: string;
  status: string;
  priority: string;
  subject?: string;
  message?: string;
  description?: string;
  resolution_notes?: string;
  assigned_to?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MailDomain {
  id: string;
  domain: string;
  is_primary: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailAlias {
  id: string;
  alias_address: string;
  target_addresses: string[];
  is_distribution_list: boolean;
  description?: string;
  active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UserTemplate {
  id: string;
  name: string;
  description?: string;
  quota_bytes: number;
  permissions: Record<string, unknown>;
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendingTier {
  id: string;
  name: string;
  display_name: string;
  daily_limit: number;
  hourly_limit: number;
  price_monthly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_group: string;
  priority: string;
  published: boolean;
  published_at?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export interface ScheduledAction {
  id: string;
  action_type: string;
  target_type: string;
  target_ids: string[];
  scheduled_for: string;
  status: string;
  action_data: Record<string, unknown>;
  created_by?: string;
  executed_at?: string;
  created_at: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export interface QuotaPreset {
  name: string;
  value: number;
}

export interface StorageStatsExtended {
  total_allocated: number;
  total_used: number;
  average_usage_percent: number;
  users_over_90_percent: number;
  top_users: Array<{
    email: string;
    usage_bytes: number;
    quota_bytes: number;
    usage_percent: number;
  }>;
}

export interface UserActivityStats {
  total_users: number;
  active_last_7_days: number;
  active_last_30_days: number;
  inactive_30_days: number;
  inactive_60_days: number;
  inactive_90_days: number;
  never_logged_in: number;
}

export interface EmailSendingLimit {
  id: string;
  user_id: string;
  email?: string;
  name?: string;
  tier_id: string | null;
  tier_name: string;
  daily_limit: number;
  hourly_limit: number;
  emails_sent_today: number;
  emails_sent_this_hour: number;
  usage_percent: number;
  last_reset_date: string;
  last_reset_hour: string;
  is_sending_enabled: boolean;
  custom_limit_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendingLimitViolation {
  id: string;
  user_id: string;
  email?: string;
  name?: string;
  violation_type: string;
  attempted_count: number;
  limit_at_time: number;
  violation_details: Record<string, unknown>;
  action_taken: string;
  admin_notes: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface SendingLimitStats {
  total_sent_today: number;
  users_at_limit: number;
  users_near_limit: number;
  active_violations: number;
  total_users: number;
  revenue_opportunity_count: number;
}
