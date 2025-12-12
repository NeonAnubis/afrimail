export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | null;
  recovery_email: string | null;
  recovery_phone: string | null;
  is_suspended: boolean;
  last_login: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login: string | null;
}

export interface MailboxInfo {
  email: string;
  quota_bytes: number;
  usage_bytes: number;
  quota_used_percentage: number;
}

export interface AuditLog {
  id: string;
  action_type: string;
  admin_email: string;
  target_user_email: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  timestamp: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User | AdminUser;
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

export interface ForgotPasswordData {
  email: string;
  method: 'email' | 'sms';
}

export interface VerifyOTPData {
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

export interface UpdateRecoveryData {
  recovery_email: string;
  recovery_phone: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface LoginActivity {
  id: string;
  user_email: string;
  login_time: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface EmailAlias {
  id: string;
  alias_address: string;
  target_addresses: string[];
  is_distribution_list: boolean;
  description: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_group: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_type: 'password_reset' | 'account_unlock' | 'quota_increase' | 'general';
  user_email: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  description: string | null;
  resolution_notes: string | null;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface QuotaPreset {
  name: string;
  value: number;
}

export interface StorageStats {
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
  created_at: string;
  updated_at: string;
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
  violation_details: Record<string, any>;
  action_taken: string;
  admin_notes: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface EmailSendLog {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_count: number;
  subject: string | null;
  status: string;
  failure_reason: string | null;
  blocked_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  sent_at: string;
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

export interface SignupAttempt {
  id: string;
  ip_address: string;
  email_attempted: string;
  hcaptcha_verified: boolean;
  honeypot_filled: boolean;
  success: boolean;
  failure_reason: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface HCaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface RateLimitCheck {
  allowed: boolean;
  attempts_last_hour: number;
  attempts_last_day: number;
  hourly_limit: number;
  daily_limit: number;
}
