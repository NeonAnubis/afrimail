import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { create, verify } from 'https://deno.land/x/djwt@v3.0.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'default-secret-key-change-in-production';
const HCAPTCHA_SECRET = Deno.env.get('HCAPTCHA_SECRET_KEY') || '';
const RATE_LIMIT_HOURLY = parseInt(Deno.env.get('RATE_LIMIT_SIGNUPS_PER_HOUR') || '5');
const RATE_LIMIT_DAILY = parseInt(Deno.env.get('RATE_LIMIT_SIGNUPS_PER_DAY') || '10');

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

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

async function verifyHCaptcha(token: string, remoteip?: string): Promise<boolean> {
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: token,
        ...(remoteip && { remoteip }),
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return false;
  }
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

async function checkRateLimit(supabase: any, ipAddress: string) {
  const { data, error } = await supabase.rpc('check_signup_rate_limit', {
    p_ip_address: ipAddress,
    p_hourly_limit: RATE_LIMIT_HOURLY,
    p_daily_limit: RATE_LIMIT_DAILY,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true };
  }

  return data;
}

async function logSignupAttempt(
  supabase: any,
  ipAddress: string,
  email: string,
  hcaptchaVerified: boolean,
  honeypotFilled: boolean,
  success: boolean,
  failureReason: string | null,
  userAgent: string | null
) {
  await supabase.from('signup_attempts').insert({
    ip_address: ipAddress,
    email_attempted: email,
    hcaptcha_verified: hcaptchaVerified,
    honeypot_filled: honeypotFilled,
    success,
    failure_reason: failureReason,
    user_agent: userAgent,
  });
}

async function handleSignup(req: Request) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers.get('user-agent');
    const body = await req.json();

    const {
      first_name,
      last_name,
      email,
      password,
      date_of_birth,
      gender,
      recovery_email,
      recovery_phone,
      hcaptcha_token,
      honeypot,
    } = body;

    const supabase = getSupabaseClient();

    if (honeypot) {
      await logSignupAttempt(supabase, ipAddress, email || 'unknown', false, true, false, 'Honeypot filled', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid request',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!first_name || !last_name || !email || !password) {
      await logSignupAttempt(supabase, ipAddress, email || 'unknown', false, false, false, 'Missing required fields', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'First name, last name, email, and password are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const rateLimitCheck = await checkRateLimit(supabase, ipAddress);

    if (!rateLimitCheck.allowed) {
      await logSignupAttempt(supabase, ipAddress, email, false, false, false, 'Rate limit exceeded', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many signup attempts. Please try again later.',
          details: {
            attempts_last_hour: rateLimitCheck.attempts_last_hour,
            attempts_last_day: rateLimitCheck.attempts_last_day,
          },
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!hcaptcha_token) {
      await logSignupAttempt(supabase, ipAddress, email, false, false, false, 'Missing hCaptcha token', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Please complete the captcha verification',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const hcaptchaValid = await verifyHCaptcha(hcaptcha_token, ipAddress);

    if (!hcaptchaValid) {
      await logSignupAttempt(supabase, ipAddress, email, false, false, false, 'Invalid hCaptcha', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Captcha verification failed. Please try again.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (date_of_birth) {
      const age = calculateAge(date_of_birth);

      if (age < 8) {
        await logSignupAttempt(supabase, ipAddress, email, true, false, false, 'Age requirement not met', userAgent);

        return new Response(
          JSON.stringify({
            success: false,
            message: 'You must be at least 8 years old to create an account',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const { data: existingUser } = await supabase
      .from('users_extended')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      await logSignupAttempt(supabase, ipAddress, email, true, false, false, 'Email already exists', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'An account with this email already exists',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('users_extended')
      .insert({
        email,
        first_name,
        last_name,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        recovery_email: recovery_email || null,
        recovery_phone: recovery_phone || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('User creation error:', insertError);
      await logSignupAttempt(supabase, ipAddress, email, true, false, false, 'Database error', userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create account. Please try again.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await logSignupAttempt(supabase, ipAddress, email, true, false, true, null, userAgent);

    const key = await getJWTKey();
    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: newUser.id,
        email: newUser.email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      },
      key
    );

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: newUser,
        message: 'Account created successfully',
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred during signup',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleAdminLogin(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Email and password are required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = getSupabaseClient();

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !admin) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid credentials',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const passwordMatch = bcrypt.compareSync(password, admin.password_hash);

  if (!passwordMatch) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid credentials',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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

  return new Response(
    JSON.stringify({
      success: true,
      token,
      user: adminWithoutPassword,
      message: 'Login successful',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleGetAuthMe(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'No token provided',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid token',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = getSupabaseClient();
  const isAdmin = payload.isAdmin === true;

  if (isAdmin) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, email, name, created_at')
      .eq('id', payload.sub)
      .maybeSingle();

    if (admin) {
      return new Response(
        JSON.stringify({
          user: admin,
          isAdmin: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      message: 'User not found',
    }),
    {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === '/api/auth/signup' && req.method === 'POST') {
      return await handleSignup(req);
    }

    if (path === '/api/admin/auth/login' && req.method === 'POST') {
      return await handleAdminLogin(req);
    }

    if (path === '/api/auth/me' && req.method === 'GET') {
      return await handleGetAuthMe(req);
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Route not found',
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});