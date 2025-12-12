import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Users, CheckCircle, XCircle, Loader } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Card } from '../components/ui/Card';
import { ApiClient, setAuthToken } from '../lib/api';
import { SignupData } from '../types';

// Get hCaptcha site key from environment
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    date_of_birth: '',
    gender: '',
    recovery_email: '',
    recovery_phone: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [hcaptchaToken, setHcaptchaToken] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [suggestedEmail, setSuggestedEmail] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const navigate = useNavigate();
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    if (formData.date_of_birth) {
      const calculatedAge = calculateAge(formData.date_of_birth);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.date_of_birth]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  useEffect(() => {
    if (formData.email) {
      const emailValue = formData.email.trim();
      if (emailValue.includes('@')) {
        const [username] = emailValue.split('@');
        setSuggestedEmail(`${username}@afrimail.com`);
      } else {
        setSuggestedEmail(`${emailValue}@afrimail.com`);
      }
    } else {
      setSuggestedEmail('yourname@afrimail.com');
    }
  }, [formData.email]);

  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.email || !formData.email.trim()) {
        setUsernameAvailable(null);
        setUsernameError('');
        return;
      }

      const emailValue = formData.email.trim();
      const username = emailValue.includes('@') ? emailValue.split('@')[0] : emailValue;

      if (!username || username.length < 2) {
        setUsernameAvailable(null);
        setUsernameError('');
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError('');

      try {
        const response = await ApiClient.get<{ available: boolean; email: string }>(
          `/auth/check-username/${encodeURIComponent(username)}`
        );

        if (response.available) {
          setUsernameAvailable(true);
          setUsernameError('');
        } else {
          setUsernameAvailable(false);
          setUsernameError(`Username "${username}" is already taken`);
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 13;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleHCaptchaVerify = (token: string) => {
    setHcaptchaToken(token);
  };

  const handleHCaptchaExpire = () => {
    setHcaptchaToken('');
  };

  const handleHCaptchaError = () => {
    setHcaptchaToken('');
    setError('Captcha verification failed. Please try again.');
  };

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
    setHcaptchaToken('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Please enter your first and last name');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (usernameAvailable === false) {
      setError(usernameError || 'This username is already taken. Please choose a different one.');
      return;
    }

    if (isCheckingUsername) {
      setError('Please wait while we check username availability');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (passwordStrength < 50) {
      setError('Please choose a stronger password');
      return;
    }

    if (formData.date_of_birth && age !== null && age < 8) {
      setError('You must be at least 8 years old to create an account');
      return;
    }

    if (!hcaptchaToken) {
      setError('Please complete the captcha verification');
      return;
    }

    setIsLoading(true);

    try {
      const signupData: SignupData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender ? formData.gender as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' : undefined,
        recovery_email: formData.recovery_email,
        recovery_phone: formData.recovery_phone,
        hcaptcha_token: hcaptchaToken,
      };

      const response = await ApiClient.post<{ success: boolean; token: string; message: string }>('/auth/signup', {
        ...signupData,
        honeypot,
      });

      if (response.success && response.token) {
        setAuthToken(response.token);
        navigate('/dashboard', { state: { message: 'Welcome! Your account has been created successfully.' } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join Africa's Continental Email Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Personal Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                name="first_name"
                label="First Name"
                placeholder="John"
                icon={<User className="w-5 h-5" />}
                value={formData.first_name}
                onChange={handleChange}
                required
              />

              <Input
                type="text"
                name="last_name"
                label="Last Name"
                placeholder="Doe"
                icon={<User className="w-5 h-5" />}
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="john.doe"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={handleChange}
              required
            />

            {formData.email && (
              <div className={`mt-2 p-3 rounded-lg border ${
                isCheckingUsername
                  ? 'bg-gray-50 border-gray-200'
                  : usernameAvailable === false
                  ? 'bg-red-50 border-red-200'
                  : usernameAvailable === true
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Your email: <span className={`font-semibold ${
                      usernameAvailable === false
                        ? 'text-red-700'
                        : usernameAvailable === true
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}>{suggestedEmail}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    {isCheckingUsername && (
                      <>
                        <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                        <span className="text-xs text-gray-600">Checking...</span>
                      </>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Available</span>
                      </>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">Taken</span>
                      </>
                    )}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-xs text-red-600 mt-1">{usernameError}</p>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="password"
                  name="password"
                  label="Password"
                  placeholder="Minimum 8 characters"
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                type="password"
                label="Confirm Password"
                placeholder="Re-enter password"
                icon={<Lock className="w-5 h-5" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                {age !== null && (
                  <p className="mt-1 text-sm text-gray-600">
                    Age: {age} years old {age < 8 && <span className="text-red-600 font-medium">(Minimum age is 8)</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium text-gray-900">Recovery Information</h3>

            <Input
              type="email"
              name="recovery_email"
              label="Recovery Email"
              placeholder="backup@example.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.recovery_email}
              onChange={handleChange}
              required
            />

            <PhoneInput
              label="Recovery Phone"
              placeholder="1234567890"
              value={formData.recovery_phone}
              onChange={(value) => setFormData({ ...formData, recovery_phone: value })}
              required
            />
          </div>

          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="space-y-4 border-t pt-6">
            <div className="flex justify-center">
              {HCAPTCHA_SITE_KEY ? (
                <HCaptcha
                  ref={captchaRef}
                  sitekey={HCAPTCHA_SITE_KEY}
                  onVerify={handleHCaptchaVerify}
                  onExpire={handleHCaptchaExpire}
                  onError={handleHCaptchaError}
                />
              ) : (
                <p className="text-sm text-gray-500">hCaptcha configuration missing</p>
              )}
            </div>
            {hcaptchaToken && (
              <p className="text-sm text-green-600 text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Captcha verified
              </p>
            )}
          </div>

          <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            By creating an account, you agree to our Terms of Service and Privacy Policy. We collect your information to provide and improve our email services.
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
