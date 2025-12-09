'use client';

import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/Button';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ApiClient } from '@/lib/api';
import { User } from '@/types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await ApiClient.get<User>('/auth/me');
        setUser(userData);
        setRecoveryEmail(userData.recovery_email || '');
        setRecoveryPhone(userData.recovery_phone || '');
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await ApiClient.put('/user/recovery-info', {
        recovery_email: recoveryEmail,
        recovery_phone: recoveryPhone,
      });
      const userData = await ApiClient.get<User>('/auth/me');
      setUser(userData);
      setToast({ message: 'Recovery information updated successfully', type: 'success' });
    } catch (error: unknown) {
      const err = error as Error;
      setToast({ message: err.message || 'Failed to update', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout user={user ? { email: user.email, firstName: user.first_name, lastName: user.last_name } : undefined}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600 mb-8">Manage your account information</p>

        <div className="grid gap-6 max-w-2xl">
          <Card title="Account Information">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-medium text-gray-900">
                  {user && `${user.first_name} ${user.last_name}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="text-lg font-medium text-gray-900">
                  {user?.email}
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
}
