'use client';

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ApiClient } from '@/lib/api';
import { User } from '@/types';

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await ApiClient.get<User>('/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await ApiClient.post('/user/change-password', {
        email: user?.email,
        old_password: oldPassword,
        new_password: newPassword,
      });
      setToast({ message: 'Password changed successfully', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout user={user ? { email: user.email, firstName: user.first_name, lastName: user.last_name } : undefined}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security</h1>
        <p className="text-gray-600 mb-8">Manage your password and security settings</p>

        <div className="max-w-2xl">
          <Card title="Change Password">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Input
                type="password"
                label="Current Password"
                placeholder="Enter current password"
                icon={<Lock className="w-5 h-5" />}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />

              <Input
                type="password"
                label="New Password"
                placeholder="Minimum 8 characters"
                icon={<Lock className="w-5 h-5" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                type="password"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                icon={<Lock className="w-5 h-5" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" isLoading={isLoading}>
                Change Password
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
