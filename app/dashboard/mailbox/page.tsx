'use client';

import React, { useEffect, useState } from 'react';
import { Database, HardDrive, Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ApiClient } from '@/lib/api';
import { MailboxInfo, User } from '@/types';
import { formatBytes } from '@/lib/utils';

export default function MailboxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mailboxInfo, setMailboxInfo] = useState<MailboxInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, mailboxData] = await Promise.all([
          ApiClient.get<User>('/auth/me'),
          ApiClient.get<MailboxInfo>('/user/mailbox-info'),
        ]);
        setUser(userData);
        setMailboxInfo(mailboxData);
      } catch (error) {
        console.error('Failed to fetch mailbox info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout user={user ? { email: user.email, firstName: user.first_name, lastName: user.last_name } : undefined}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mailbox</h1>
        <p className="text-gray-600 mb-8">View your mailbox quota and usage</p>

        {isLoading ? (
          <Loading />
        ) : mailboxInfo ? (
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <Mail className="w-12 h-12 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {mailboxInfo.email}
                  </h3>
                  <p className="text-gray-600">Your mailbox</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Quota Limit</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatBytes(mailboxInfo.quota_bytes)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Used Space</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatBytes(mailboxInfo.usage_bytes)}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Storage Usage">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatBytes(mailboxInfo.usage_bytes)} used
                  </span>
                  <span className="text-gray-600">
                    {formatBytes(mailboxInfo.quota_bytes)} total
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      mailboxInfo.quota_used_percentage > 90
                        ? 'bg-red-600'
                        : mailboxInfo.quota_used_percentage > 75
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(mailboxInfo.quota_used_percentage, 100)}%` }}
                  />
                </div>
                <p className="text-center text-lg font-semibold text-gray-900">
                  {mailboxInfo.quota_used_percentage.toFixed(1)}% Used
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-gray-600">Failed to load mailbox information</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
