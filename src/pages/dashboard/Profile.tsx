import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { Button } from '../../components/ui/Button';
import { Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiClient } from '../../lib/api';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Toast, ToastContainer } from '../../components/ui/Toast';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [recoveryEmail, setRecoveryEmail] = useState(
    'recovery_email' in user! ? user.recovery_email || '' : ''
  );
  const [recoveryPhone, setRecoveryPhone] = useState(
    'recovery_phone' in user! ? user.recovery_phone || '' : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await ApiClient.put('/user/recovery-info', {
        recovery_email: recoveryEmail,
        recovery_phone: recoveryPhone,
      });
      await refreshUser();
      setToast({ message: 'Recovery information updated successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600 mb-8">Manage your account information</p>

        <div className="grid gap-6 max-w-2xl">
          <Card title="Account Information">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-medium text-gray-900">
                  {'first_name' in user! && `${user.first_name} ${user.last_name}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="text-lg font-medium text-gray-900">
                  {'email' in user! && user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg font-medium text-gray-900">
                  {user && new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Recovery Information">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Recovery Email"
                placeholder="backup@example.com"
                icon={<Mail className="w-5 h-5" />}
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
              />

              <PhoneInput
                label="Recovery Phone"
                placeholder="1234567890"
                value={recoveryPhone}
                onChange={(value) => setRecoveryPhone(value)}
                required
              />

              <Button type="submit" isLoading={isLoading}>
                Update Recovery Info
              </Button>
            </form>
          </Card>
        </div>

        {toast && (
          <ToastContainer>
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </ToastContainer>
        )}
      </div>
    </DashboardLayout>
  );
};
