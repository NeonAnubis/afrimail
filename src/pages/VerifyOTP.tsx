import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ApiClient } from '../lib/api';

export const VerifyOTP: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const method = location.state?.method || 'email';

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await ApiClient.post('/auth/verify-otp', { email, otp_code: otpCode });
      navigate('/reset-password', { state: { email, otp_code: otpCode } });
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Verify Code</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code sent to your {method === 'email' ? 'recovery email' : 'phone'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            type="text"
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Verify Code
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm">
            Request new code
          </Link>
        </div>
      </Card>
    </div>
  );
};
