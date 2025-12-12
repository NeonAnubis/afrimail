import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, Shield, Settings, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { useAuth } from '../../contexts/AuthContext';
import { ApiClient } from '../../lib/api';
import { MailboxInfo } from '../../types';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [mailboxInfo, setMailboxInfo] = useState<MailboxInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMailboxInfo = async () => {
      try {
        const data = await ApiClient.get<MailboxInfo>('/user/mailbox-info');
        setMailboxInfo(data);
      } catch (error) {
        console.error('Failed to fetch mailbox info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMailboxInfo();
  }, []);

  const quickActions = [
    { icon: User, label: 'Update Profile', path: '/dashboard/profile', color: 'blue' },
    { icon: Shield, label: 'Security', path: '/dashboard/security', color: 'green' },
    { icon: Mail, label: 'Mailbox Info', path: '/dashboard/mailbox', color: 'purple' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings', color: 'gray' },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back, {'first_name' in user! && user.first_name}!
        </p>

        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email Address</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {'email' in user! && user.email}
                  </p>
                </div>
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mailbox Usage</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {mailboxInfo
                      ? `${mailboxInfo.quota_used_percentage.toFixed(1)}%`
                      : 'Loading...'}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <p className="text-lg font-semibold text-green-600">Active</p>
                </div>
                <Shield className="w-10 h-10 text-green-600" />
              </div>
            </Card>
          </div>
        )}

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path}>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-2 text-${action.color}-600`} />
                    <p className="text-sm font-medium text-gray-900">{action.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
