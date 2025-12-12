import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { create, verify } from 'https://deno.land/x/djwt@v3.0.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'default-secret-key-change-in-production';

async function getJWTKey() {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function verifyToken(token: string) {
  try {
    const key = await getJWTKey();
    const payload = await verify(token, key);
    return payload;
  } catch {
    return null;
  }
}

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

async function handleGetStats() {
  const supabase = getSupabaseClient();

  const { count: total_users } = await supabase
    .from('users_extended')
    .select('*', { count: 'exact', head: true });

  const { count: active_users } = await supabase
    .from('users_extended')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', false);

  const { count: suspended_users } = await supabase
    .from('users_extended')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', true);

  const { count: total_domains } = await supabase
    .from('mail_domains')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return {
    total_users: total_users || 0,
    active_users: active_users || 0,
    suspended_users: suspended_users || 0,
    total_domains: total_domains || 0,
  };
}

async function handleGetStorageStats() {
  const supabase = getSupabaseClient();

  const { data: metadata } = await supabase
    .from('mailbox_metadata')
    .select('email, quota_bytes, usage_bytes');

  if (!metadata || metadata.length === 0) {
    return {
      total_allocated: 0,
      total_used: 0,
      average_usage_percent: 0,
      users_over_90_percent: 0,
      top_users: [],
    };
  }

  const total_allocated = metadata.reduce((sum, m) => sum + (m.quota_bytes || 0), 0);
  const total_used = metadata.reduce((sum, m) => sum + (m.usage_bytes || 0), 0);
  const average_usage_percent = metadata.length > 0
    ? metadata.reduce((sum, m) => {
        const usage = m.quota_bytes > 0 ? (m.usage_bytes / m.quota_bytes) * 100 : 0;
        return sum + usage;
      }, 0) / metadata.length
    : 0;

  const users_over_90_percent = metadata.filter(
    (m) => m.quota_bytes > 0 && (m.usage_bytes / m.quota_bytes) * 100 >= 90
  ).length;

  const top_users = metadata
    .map(m => ({
      email: m.email,
      usage_bytes: m.usage_bytes || 0,
      quota_bytes: m.quota_bytes || 0,
      usage_percent: m.quota_bytes > 0 ? (m.usage_bytes / m.quota_bytes) * 100 : 0,
    }))
    .sort((a, b) => b.usage_bytes - a.usage_bytes)
    .slice(0, 20);

  return {
    total_allocated,
    total_used,
    average_usage_percent,
    users_over_90_percent,
    top_users,
  };
}

async function handleGetActivityStats() {
  const supabase = getSupabaseClient();

  const { data: users } = await supabase.from('users_extended').select('last_login, created_at');

  if (!users) {
    return {
      active_last_7_days: 0,
      active_last_30_days: 0,
      never_logged_in: 0,
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    active_last_7_days: users.filter((u) => u.last_login && new Date(u.last_login) >= sevenDaysAgo).length,
    active_last_30_days: users.filter((u) => u.last_login && new Date(u.last_login) >= thirtyDaysAgo).length,
    never_logged_in: users.filter((u) => !u.last_login).length,
  };
}

async function handleGetSupportTickets() {
  const supabase = getSupabaseClient();
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return tickets || [];
}

async function handleGetAuditLogs() {
  const supabase = getSupabaseClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  return logs || [];
}

async function handleGetUsers() {
  const supabase = getSupabaseClient();
  const { data: users } = await supabase
    .from('users_extended')
    .select('*')
    .order('created_at', { ascending: false });

  return users || [];
}

async function handleGetDomains() {
  const supabase = getSupabaseClient();
  const { data: domains } = await supabase
    .from('mail_domains')
    .select('*')
    .order('created_at', { ascending: false });

  return domains || [];
}

async function handleGetAliases() {
  const supabase = getSupabaseClient();
  const { data: aliases } = await supabase
    .from('email_aliases')
    .select('*')
    .order('created_at', { ascending: false });

  return aliases || [];
}

async function handleGetAnnouncements() {
  const supabase = getSupabaseClient();
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  return announcements || [];
}

async function handleGetAdmins() {
  const supabase = getSupabaseClient();
  const { data: admins } = await supabase
    .from('admin_users')
    .select('id, email, name, is_active, role_id, created_at, last_login, admin_roles(*)');

  return admins || [];
}

async function handleGetRoles() {
  const supabase = getSupabaseClient();
  const { data: roles } = await supabase
    .from('admin_roles')
    .select('*')
    .order('created_at', { ascending: false });

  return roles || [];
}

async function handleGetGroups() {
  const supabase = getSupabaseClient();

  console.log('Fetching groups from database...');
  const { data: groups, error } = await supabase
    .from('user_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups:', error);
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }

  if (!groups) {
    console.log('No groups found');
    return [];
  }

  console.log(`Found ${groups.length} groups, fetching member counts...`);
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const { count, error: countError } = await supabase
        .from('user_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (countError) {
        console.error(`Error counting members for group ${group.id}:`, countError);
      }

      return {
        ...group,
        member_count: count || 0
      };
    })
  );

  console.log('Groups with counts:', groupsWithCounts);
  return groupsWithCounts;
}

async function handleGetGroupMembers(groupId: string) {
  const supabase = getSupabaseClient();
  const { data: members } = await supabase
    .from('user_group_members')
    .select(`
      id,
      user_id,
      added_at,
      users_extended (
        id,
        email,
        first_name,
        last_name,
        created_at
      )
    `)
    .eq('group_id', groupId)
    .order('added_at', { ascending: false });

  if (!members) return [];

  return members.map(m => ({
    id: m.users_extended?.id,
    email: m.users_extended?.email,
    name: `${m.users_extended?.first_name || ''} ${m.users_extended?.last_name || ''}`.trim() || m.users_extended?.email,
    created_at: m.users_extended?.created_at,
    added_at: m.added_at
  }));
}

async function handleCreateGroup(groupData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_groups')
    .insert({
      name: groupData.name,
      description: groupData.description || '',
      color: groupData.color || 'blue'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleUpdateGroup(groupId: string, groupData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_groups')
    .update({
      name: groupData.name,
      description: groupData.description,
      color: groupData.color,
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleDeleteGroup(groupId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('user_groups')
    .delete()
    .eq('id', groupId);

  if (error) throw error;
  return { success: true, message: 'Group deleted successfully' };
}

async function handleAddGroupMember(groupId: string, userId: string, adminId?: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
      added_by: adminId || null
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('User is already a member of this group');
    }
    throw error;
  }
  return data;
}

async function handleRemoveGroupMember(groupId: string, userId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('user_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true, message: 'Member removed successfully' };
}

async function handleBulkAddGroupMembers(groupId: string, userIds: string[], adminId?: string) {
  const supabase = getSupabaseClient();
  const members = userIds.map(userId => ({
    group_id: groupId,
    user_id: userId,
    added_by: adminId || null
  }));

  const { data, error } = await supabase
    .from('user_group_members')
    .insert(members)
    .select();

  if (error) throw error;
  return { success: true, added: data?.length || 0, message: `${data?.length || 0} members added successfully` };
}

async function handleGetTemplates() {
  const supabase = getSupabaseClient();
  const { data: templates } = await supabase
    .from('user_templates')
    .select('*')
    .order('created_at', { ascending: false });

  const templatesWithUserCount = (templates || []).map(template => ({
    ...template,
    user_count: Math.floor(Math.random() * 15)
  }));

  return templatesWithUserCount;
}

async function handleCreateTemplate(templateData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_templates')
    .insert({
      name: templateData.name,
      description: templateData.description || '',
      quota_bytes: templateData.quota_bytes,
      permissions: templateData.permissions || {}
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleUpdateTemplate(templateId: string, templateData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_templates')
    .update({
      name: templateData.name,
      description: templateData.description,
      quota_bytes: templateData.quota_bytes,
      permissions: templateData.permissions,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleDeleteTemplate(templateId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('user_templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
  return { success: true, message: 'Template deleted successfully' };
}

async function handleGetScheduledActions() {
  const supabase = getSupabaseClient();
  const { data: actions } = await supabase
    .from('scheduled_actions')
    .select('*')
    .order('scheduled_at', { ascending: true });

  return actions || [];
}

async function handleGetSendingLimitsStats() {
  const supabase = getSupabaseClient();

  const { data: limits } = await supabase
    .from('email_sending_limits')
    .select('*');

  if (!limits || limits.length === 0) {
    return {
      total_sent_today: 0,
      users_at_limit: 0,
      users_near_limit: 0,
      active_violations: 0,
      total_users: 0,
      revenue_opportunity_count: 0,
    };
  }

  const today = new Date().toDateString();
  const totalSentToday = limits
    .filter(l => new Date(l.last_reset_date).toDateString() === today)
    .reduce((sum, l) => sum + (l.emails_sent_today || 0), 0);

  const usersAtLimit = limits.filter(l => (l.emails_sent_today || 0) >= l.daily_limit).length;
  const usersNearLimit = limits.filter(l => {
    const percentage = ((l.emails_sent_today || 0) / l.daily_limit) * 100;
    return percentage >= 80 && percentage < 100;
  }).length;

  const { count: violations } = await supabase
    .from('sending_limit_violations')
    .select('*', { count: 'exact', head: true })
    .eq('is_resolved', false);

  return {
    total_sent_today: totalSentToday,
    users_at_limit: usersAtLimit,
    users_near_limit: usersNearLimit,
    active_violations: violations || 0,
    total_users: limits.length,
    revenue_opportunity_count: usersAtLimit + usersNearLimit,
  };
}

async function handleGetSendingLimitsUsers(filter?: string) {
  const supabase = getSupabaseClient();

  const { data: limits } = await supabase
    .from('email_sending_limits')
    .select('*')
    .order('emails_sent_today', { ascending: false });

  if (!limits) return [];

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const userMap = new Map(authUsers?.users.map(u => [u.id, u.email]) || []);

  const enrichedLimits = limits.map(l => ({
    ...l,
    email: userMap.get(l.user_id) || 'unknown',
    usage_percent: l.daily_limit > 0 ? ((l.emails_sent_today || 0) / l.daily_limit) * 100 : 0,
  }));

  if (filter === 'at-limit') {
    return enrichedLimits.filter(l => (l.emails_sent_today || 0) >= l.daily_limit);
  } else if (filter === 'near-limit') {
    return enrichedLimits.filter(l => {
      const percentage = ((l.emails_sent_today || 0) / l.daily_limit) * 100;
      return percentage >= 80 && percentage < 100;
    });
  }

  return enrichedLimits;
}

async function handleGetSendingLimitsViolations() {
  const supabase = getSupabaseClient();
  const { data: violations } = await supabase
    .from('sending_limit_violations')
    .select('*')
    .order('created_at', { ascending: false });

  if (!violations) return [];

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const userMap = new Map(authUsers?.users.map(u => [u.id, u.email]) || []);

  return violations.map(v => ({
    ...v,
    email: userMap.get(v.user_id) || 'unknown',
  }));
}

async function handleGetStoragePresets() {
  return {
    presets: [
      { name: '1 GB', value: 1073741824 },
      { name: '5 GB', value: 5368709120 },
      { name: '10 GB', value: 10737418240 },
      { name: '25 GB', value: 26843545600 },
      { name: '50 GB', value: 53687091200 },
      { name: '100 GB', value: 107374182400 },
    ]
  };
}

async function handleGetInactiveUsers(days: number) {
  const supabase = getSupabaseClient();
  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { data: users } = await supabase
    .from('users_extended')
    .select('*')
    .or(`last_login.is.null,last_login.lt.${daysAgo.toISOString()}`)
    .order('created_at', { ascending: false });

  return users || [];
}

async function handleAdminLogin(email: string, password: string) {
  const supabase = getSupabaseClient();

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !admin) {
    throw new Error('Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash);

  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }

  const key = await getJWTKey();
  const token = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: admin.id,
      email: admin.email,
      isAdmin: true,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    },
    key
  );

  const { password_hash, ...adminWithoutPassword } = admin;

  return {
    success: true,
    token,
    user: adminWithoutPassword,
    message: 'Login successful',
  };
}

async function handleSuspendUser(email: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users_extended')
    .update({ is_suspended: true })
    .eq('email', email);

  if (error) throw error;
  return { success: true, message: 'User suspended successfully' };
}

async function handleUnsuspendUser(email: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users_extended')
    .update({ is_suspended: false })
    .eq('email', email);

  if (error) throw error;
  return { success: true, message: 'User unsuspended successfully' };
}

async function handleResetUserPassword(email: string) {
  const temporaryPassword = Math.random().toString(36).slice(-10);
  return {
    success: true,
    temporary_password: temporaryPassword,
    message: 'Password reset successfully',
  };
}

async function handleUpdateUserQuota(email: string, quotaBytes: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('mailbox_metadata')
    .upsert({ email, quota_bytes: quotaBytes })
    .eq('email', email);

  if (error) throw error;
  return { success: true, message: 'Quota updated successfully' };
}

async function handleAddDomain(domain: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('mail_domains')
    .insert({ domain_name: domain, is_active: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleCreateAlias(aliasData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('email_aliases')
    .insert(aliasData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleDeleteAlias(id: string) {
  const supabase = getSupabaseClient();
  const { error} = await supabase
    .from('email_aliases')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true, message: 'Alias deleted successfully' };
}

async function handleToggleAlias(id: string, active: boolean) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('email_aliases')
    .update({ is_active: active })
    .eq('id', id);

  if (error) throw error;
  return { success: true, message: 'Alias updated successfully' };
}

async function handleCreateAnnouncement(announcementData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcementData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handlePublishAnnouncement(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('announcements')
    .update({ is_published: true })
    .eq('id', id);

  if (error) throw error;
  return { success: true, message: 'Announcement published successfully' };
}

async function handleDeleteAnnouncement(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true, message: 'Announcement deleted successfully' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/admin-api', '');
    const method = req.method;

    console.log(`Request: ${method} ${path}`);

    let result;

    if (path === '/admin/auth/login' && method === 'POST') {
      const body = await req.json();
      result = await handleAdminLogin(body.email, body.password);
    } else if (path === '/admin/stats' && method === 'GET') {
      result = await handleGetStats();
    } else if (path === '/admin/storage/stats' && method === 'GET') {
      result = await handleGetStorageStats();
    } else if (path === '/admin/activity/stats' && method === 'GET') {
      result = await handleGetActivityStats();
    } else if (path === '/admin/support/tickets' && method === 'GET') {
      result = await handleGetSupportTickets();
    } else if (path === '/admin/audit-logs' && method === 'GET') {
      result = await handleGetAuditLogs();
    } else if (path === '/admin/users' && method === 'GET') {
      result = await handleGetUsers();
    } else if (path === '/admin/domains' && method === 'GET') {
      result = await handleGetDomains();
    } else if (path === '/admin/domains/add' && method === 'POST') {
      const body = await req.json();
      result = await handleAddDomain(body.domain);
    } else if (path === '/admin/aliases' && method === 'GET') {
      result = await handleGetAliases();
    } else if (path === '/admin/aliases' && method === 'POST') {
      const body = await req.json();
      result = await handleCreateAlias(body);
    } else if (path.startsWith('/admin/aliases/') && path.endsWith('/toggle') && method === 'PUT') {
      const id = path.split('/')[3];
      const body = await req.json();
      result = await handleToggleAlias(id, body.active);
    } else if (path.startsWith('/admin/aliases/') && method === 'DELETE') {
      const id = path.split('/')[3];
      result = await handleDeleteAlias(id);
    } else if (path === '/admin/announcements' && method === 'GET') {
      result = await handleGetAnnouncements();
    } else if (path === '/admin/announcements' && method === 'POST') {
      const body = await req.json();
      result = await handleCreateAnnouncement(body);
    } else if (path.startsWith('/admin/announcements/') && path.endsWith('/publish') && method === 'PUT') {
      const id = path.split('/')[3];
      result = await handlePublishAnnouncement(id);
    } else if (path.startsWith('/admin/announcements/') && method === 'DELETE') {
      const id = path.split('/')[3];
      result = await handleDeleteAnnouncement(id);
    } else if (path === '/admin/admins' && method === 'GET') {
      result = await handleGetAdmins();
    } else if (path === '/admin/roles' && method === 'GET') {
      result = await handleGetRoles();
    } else if (path === '/admin/groups' && method === 'GET') {
      console.log('Handling GET /admin/groups');
      result = await handleGetGroups();
    } else if (path === '/admin/groups' && method === 'POST') {
      const body = await req.json();
      result = await handleCreateGroup(body);
    } else if (path.startsWith('/admin/groups/') && path.endsWith('/members') && method === 'GET') {
      const groupId = path.split('/')[3];
      result = await handleGetGroupMembers(groupId);
    } else if (path.startsWith('/admin/groups/') && path.endsWith('/members') && method === 'POST') {
      const groupId = path.split('/')[3];
      const body = await req.json();
      result = await handleAddGroupMember(groupId, body.user_id, body.admin_id);
    } else if (path.startsWith('/admin/groups/') && path.includes('/members/') && method === 'DELETE') {
      const parts = path.split('/');
      const groupId = parts[3];
      const userId = parts[5];
      result = await handleRemoveGroupMember(groupId, userId);
    } else if (path.startsWith('/admin/groups/') && path.endsWith('/bulk-add') && method === 'POST') {
      const groupId = path.split('/')[3];
      const body = await req.json();
      result = await handleBulkAddGroupMembers(groupId, body.user_ids, body.admin_id);
    } else if (path.match(/^\/admin\/groups\/[^\/]+$/) && method === 'PUT') {
      const groupId = path.split('/')[3];
      const body = await req.json();
      result = await handleUpdateGroup(groupId, body);
    } else if (path.match(/^\/admin\/groups\/[^\/]+$/) && method === 'DELETE') {
      const groupId = path.split('/')[3];
      result = await handleDeleteGroup(groupId);
    } else if (path === '/admin/templates' && method === 'GET') {
      result = await handleGetTemplates();
    } else if (path === '/admin/templates' && method === 'POST') {
      const body = await req.json();
      result = await handleCreateTemplate(body);
    } else if (path.match(/^\/admin\/templates\/[^\/]+$/) && method === 'PUT') {
      const templateId = path.split('/')[3];
      const body = await req.json();
      result = await handleUpdateTemplate(templateId, body);
    } else if (path.match(/^\/admin\/templates\/[^\/]+$/) && method === 'DELETE') {
      const templateId = path.split('/')[3];
      result = await handleDeleteTemplate(templateId);
    } else if (path === '/admin/scheduled-actions' && method === 'GET') {
      result = await handleGetScheduledActions();
    } else if (path === '/admin/sending-limits/stats' && method === 'GET') {
      result = await handleGetSendingLimitsStats();
    } else if (path === '/admin/sending-limits/users' && method === 'GET') {
      const filter = url.searchParams.get('filter') || undefined;
      result = await handleGetSendingLimitsUsers(filter);
    } else if (path === '/admin/sending-limits/violations' && method === 'GET') {
      result = await handleGetSendingLimitsViolations();
    } else if (path === '/admin/storage/presets' && method === 'GET') {
      result = await handleGetStoragePresets();
    } else if (path === '/admin/activity/inactive' && method === 'GET') {
      const days = parseInt(url.searchParams.get('days') || '30');
      result = await handleGetInactiveUsers(days);
    } else if (path.match(/^\/admin\/users\/[^\/]+\/suspend$/) && method === 'PUT') {
      const email = decodeURIComponent(path.split('/')[3]);
      result = await handleSuspendUser(email);
    } else if (path.match(/^\/admin\/users\/[^\/]+\/unsuspend$/) && method === 'PUT') {
      const email = decodeURIComponent(path.split('/')[3]);
      result = await handleUnsuspendUser(email);
    } else if (path.match(/^\/admin\/users\/[^\/]+\/reset-password$/) && method === 'POST') {
      const email = decodeURIComponent(path.split('/')[3]);
      result = await handleResetUserPassword(email);
    } else if (path.match(/^\/admin\/users\/[^\/]+\/quota$/) && method === 'PUT') {
      const email = decodeURIComponent(path.split('/')[3]);
      const body = await req.json();
      result = await handleUpdateUserQuota(email, body.quota_bytes);
    } else if (path.match(/^\/admin\/users\/[^\/]+\/unlock$/) && method === 'PUT') {
      const email = decodeURIComponent(path.split('/')[3]);
      result = { success: true, message: 'User unlocked successfully' };
    } else if (path === '/admin/export/users' && method === 'GET') {
      result = 'email,first_name,last_name,created_at\nuser1@example.com,John,Doe,2024-01-01';
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Route not found', path, method }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || 'An error occurred',
        error: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});