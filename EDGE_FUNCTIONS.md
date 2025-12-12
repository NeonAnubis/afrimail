# Edge Functions Implementation Guide

This document provides complete implementation details for all Supabase Edge Functions required by the Mailcow Public Signup platform.

## Overview

Edge Functions act as a secure backend layer between the frontend and Mailcow API. They handle:
- Mailcow API authentication
- Business logic and validation
- Database operations
- Email and SMS notifications
- JWT token generation and verification

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Mailcow instance with API access
- Environment variables configured in Supabase project

## Environment Variables

Set these in your Supabase project settings under "Edge Functions Secrets":

```bash
MAILCOW_API_URL=https://your-mailcow-server.com/api/v1
MAILCOW_API_KEY=your_mailcow_api_key
JWT_SECRET=your_jwt_secret_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your_smtp_password
```

## Function Structure

Each Edge Function should follow this structure:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Your function logic here

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Required Edge Functions

### 1. Authentication Function (`auth`)

**Endpoint**: `/functions/v1/auth/*`

This function handles multiple authentication-related operations based on the path.

**Routes**:
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Initiate password recovery
- `POST /auth/verify-otp` - Verify OTP code
- `POST /auth/reset-password` - Reset password with OTP
- `GET /auth/me` - Get current user info

#### Signup Implementation

```typescript
// POST /auth/signup
const { first_name, last_name, email, password, recovery_email, recovery_phone } = await req.json()

// 1. Validate input
if (!email || !password || !first_name || !last_name) {
  throw new Error('Missing required fields')
}

// 2. Check if mailbox exists in Mailcow
const checkResponse = await fetch(
  `${Deno.env.get('MAILCOW_API_URL')}/get/mailbox/${email}`,
  {
    headers: { 'X-API-Key': Deno.env.get('MAILCOW_API_KEY') }
  }
)

if (checkResponse.ok) {
  throw new Error('Email already exists')
}

// 3. Create mailbox in Mailcow
const createResponse = await fetch(
  `${Deno.env.get('MAILCOW_API_URL')}/add/mailbox`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': Deno.env.get('MAILCOW_API_KEY'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      local_part: email.split('@')[0],
      domain: email.split('@')[1],
      password: password,
      password2: password,
      name: `${first_name} ${last_name}`,
      quota: 2048,  // 2GB default quota
      active: 1
    })
  }
)

if (!createResponse.ok) {
  throw new Error('Failed to create mailbox')
}

// 4. Store extended user info in Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const { error } = await supabase
  .from('users_extended')
  .insert({
    email,
    first_name,
    last_name,
    recovery_email,
    recovery_phone
  })

if (error) throw error

return { success: true, message: 'Account created successfully' }
```

#### Login Implementation

```typescript
// POST /auth/login
const { email, password } = await req.json()

// 1. Verify credentials with Mailcow (IMAP check or API)
const verifyResponse = await fetch(
  `${Deno.env.get('MAILCOW_API_URL')}/get/mailbox/${email}`,
  {
    headers: { 'X-API-Key': Deno.env.get('MAILCOW_API_KEY') }
  }
)

if (!verifyResponse.ok) {
  throw new Error('Invalid credentials')
}

const mailbox = await verifyResponse.json()
if (mailbox.active !== 1) {
  throw new Error('Account is suspended')
}

// 2. Get user info from Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const { data: user } = await supabase
  .from('users_extended')
  .select('*')
  .eq('email', email)
  .single()

// 3. Generate JWT token
const token = await generateJWT({ email, userId: user.id }, Deno.env.get('JWT_SECRET'))

return {
  success: true,
  token,
  user
}
```

#### Forgot Password Implementation

```typescript
// POST /auth/forgot-password
const { email, method } = await req.json()  // method: 'email' | 'sms'

// 1. Get user info
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const { data: user } = await supabase
  .from('users_extended')
  .select('*')
  .eq('email', email)
  .single()

if (!user) {
  throw new Error('User not found')
}

// 2. Generate OTP
const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
const expiresAt = new Date(Date.now() + 10 * 60 * 1000)  // 10 minutes

// 3. Store OTP in database
await supabase
  .from('password_resets')
  .insert({
    email,
    otp_code: otpCode,
    otp_type: method,
    expires_at: expiresAt.toISOString()
  })

// 4. Send OTP
if (method === 'email') {
  await sendEmail(user.recovery_email, 'Password Reset Code', `Your code is: ${otpCode}`)
} else {
  await sendSMS(user.recovery_phone, `Your password reset code is: ${otpCode}`)
}

return { success: true, message: `OTP sent via ${method}` }
```

### 2. User Management Function (`user`)

**Endpoint**: `/functions/v1/user/*`

**Routes**:
- `GET /user/profile` - Get user profile
- `PUT /user/recovery-info` - Update recovery information
- `GET /user/mailbox-info` - Get mailbox quota and usage
- `POST /user/change-password` - Change password

#### Get Mailbox Info

```typescript
// GET /user/mailbox-info
const email = getUserEmailFromToken(req)

// Fetch from Mailcow
const response = await fetch(
  `${Deno.env.get('MAILCOW_API_URL')}/get/mailbox/${email}`,
  {
    headers: { 'X-API-Key': Deno.env.get('MAILCOW_API_KEY') }
  }
)

const mailbox = await response.json()

return {
  email: mailbox.username,
  quota_bytes: mailbox.quota * 1048576,  // Convert MB to bytes
  usage_bytes: mailbox.quota_used * 1048576,
  quota_used_percentage: (mailbox.quota_used / mailbox.quota) * 100
}
```

#### Change Password

```typescript
// POST /user/change-password
const { email, old_password, new_password } = await req.json()

// 1. Verify old password (optional - can skip if trusted)

// 2. Update password in Mailcow
const response = await fetch(
  `${Deno.env.get('MAILCOW_API_URL')}/edit/mailbox`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': Deno.env.get('MAILCOW_API_KEY'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [email],
      attr: {
        password: new_password,
        password2: new_password
      }
    })
  }
)

if (!response.ok) {
  throw new Error('Failed to change password')
}

return { success: true, message: 'Password changed successfully' }
```

### 3. Admin Function (`admin`)

**Endpoint**: `/functions/v1/admin/*`

**Routes**:
- `POST /admin/auth/login` - Admin login
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/users` - List all users
- `PUT /admin/users/:email/suspend` - Suspend user
- `PUT /admin/users/:email/unsuspend` - Unsuspend user
- `POST /admin/users/:email/reset-password` - Reset user password
- `PUT /admin/users/:email/quota` - Update user quota
- `GET /admin/domains` - List domains
- `POST /admin/domains/add` - Add domain
- `GET /admin/audit-logs` - Get audit logs
- `GET /admin/export/users` - Export users as CSV

#### Admin Login

```typescript
// POST /admin/auth/login
const { email, password } = await req.json()

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

// Get admin user
const { data: admin } = await supabase
  .from('admin_users')
  .select('*')
  .eq('email', email)
  .single()

if (!admin) {
  throw new Error('Invalid credentials')
}

// Verify password (using bcrypt)
const isValid = await verifyPassword(password, admin.password_hash)
if (!isValid) {
  throw new Error('Invalid credentials')
}

// Update last login
await supabase
  .from('admin_users')
  .update({ last_login: new Date().toISOString() })
  .eq('id', admin.id)

// Generate token
const token = await generateJWT({ email, userId: admin.id, isAdmin: true }, Deno.env.get('JWT_SECRET'))

return {
  success: true,
  token,
  user: { id: admin.id, email: admin.email, name: admin.name }
}
```

#### Suspend User

```typescript
// PUT /admin/users/:email/suspend
const email = getEmailFromPath(req.url)
const adminEmail = getUserEmailFromToken(req)

// Update in Mailcow
const response = await fetch(
  `${Deno.env.get('MAILCOW_API_URL')}/edit/mailbox`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': Deno.env.get('MAILCOW_API_KEY'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [email],
      attr: { active: 0 }
    })
  }
)

// Update in Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

await supabase
  .from('users_extended')
  .update({ is_suspended: true })
  .eq('email', email)

// Log action
await supabase
  .from('audit_logs')
  .insert({
    action_type: 'suspend_user',
    admin_email: adminEmail,
    target_user_email: email,
    ip_address: req.headers.get('x-forwarded-for')
  })

return { success: true, message: 'User suspended' }
```

## Helper Functions

### JWT Generation

```typescript
import { create } from "https://deno.land/x/djwt@v2.4/mod.ts"

async function generateJWT(payload: any, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  return await create(
    { alg: "HS256", typ: "JWT" },
    { ...payload, exp: Date.now() / 1000 + 3600 },  // 1 hour
    key
  )
}
```

### Email Sending

```typescript
async function sendEmail(to: string, subject: string, body: string) {
  // Using SMTP via Deno's fetch or a service like SendGrid/AWS SES
  // Implementation depends on your email service
}
```

### SMS Sending

```typescript
async function sendSMS(to: string, message: string) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: Deno.env.get('TWILIO_PHONE_NUMBER'),
        Body: message
      })
    }
  )

  return response.ok
}
```

## Deployment

### Deploy a Single Function

```bash
supabase functions deploy function-name
```

### Deploy All Functions

```bash
supabase functions deploy auth
supabase functions deploy user
supabase functions deploy admin
```

### Set Environment Variables

```bash
supabase secrets set MAILCOW_API_URL=your_url
supabase secrets set MAILCOW_API_KEY=your_key
supabase secrets set JWT_SECRET=your_secret
# ... set all other secrets
```

## Testing

Test functions locally:

```bash
supabase functions serve function-name
```

Then make requests to `http://localhost:54321/functions/v1/function-name`

## Error Handling

Always return proper error responses:

```typescript
return new Response(
  JSON.stringify({
    success: false,
    message: 'Error description',
    code: 'ERROR_CODE'
  }),
  {
    status: 400,  // or appropriate status code
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  }
)
```

## Security Best Practices

1. **Never expose sensitive data** in error messages
2. **Validate all inputs** before processing
3. **Use service role key** for Supabase operations in Edge Functions
4. **Rate limit** authentication endpoints
5. **Log all admin actions** to audit_logs table
6. **Sanitize user inputs** before passing to Mailcow API
7. **Verify JWT tokens** for protected endpoints
8. **Use HTTPS** for all Mailcow API calls

## Troubleshooting

### Function Returns 500 Error
- Check function logs in Supabase dashboard
- Verify all environment variables are set
- Test Mailcow API connectivity

### CORS Errors
- Ensure CORS headers are included in all responses
- Handle OPTIONS requests properly

### Authentication Fails
- Verify JWT secret matches between functions
- Check token expiry time
- Ensure Authorization header is sent correctly

## Next Steps

1. Implement all Edge Functions following the patterns above
2. Test each endpoint thoroughly
3. Set up monitoring and logging
4. Configure rate limiting
5. Set up backup and disaster recovery

For more information:
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Mailcow API Docs](https://mailcow.github.io/mailcow-dockerized-docs/en/usage/mailcow-api/)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
