import React, { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Users, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { ApiClient } from '../../lib/api';
import { UserActivityStats, User } from '../../types';
import { AdminLayout } from '../../components/layouts/AdminLayout';

export const Activity: React.FC = () => {
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 60 | 90>(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        ApiClient.get<UserActivityStats>('/admin/activity/stats'),
        ApiClient.get<User[]>(`/admin/activity/inactive?days=${selectedPeriod}`),
      ]);
      setStats(statsData);
      setInactiveUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLastLoginDisplay = (lastLogin: string | null): string => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getHealthScore = (user: User): { score: number; color: string; label: string } => {
    let score = 100;

    if (!user.last_login) score -= 30;
    else {
      const daysSinceLogin = Math.floor(
        (new Date().getTime() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLogin > 90) score -= 30;
      else if (daysSinceLogin > 60) score -= 20;
      else if (daysSinceLogin > 30) score -= 10;
    }

    if (!user.recovery_email && !user.recovery_phone) score -= 20;
    if (user.is_suspended) score -= 30;
    if (user.failed_login_attempts > 0) score -= 10;

    let color = 'green';
    let label = 'Healthy';

    if (score < 40) {
      color = 'red';
      label = 'Critical';
    } else if (score < 60) {
      color = 'orange';
      label = 'Warning';
    } else if (score < 80) {
      color = 'yellow';
      label = 'Fair';
    }

    return { score, color, label };
  };

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Activity & Health</h1>
        <p className="text-gray-600 mb-8">Monitor user engagement and account health</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active (7 days)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active_last_7_days}</p>
              </div>
              <ActivityIcon className="w-10 h-10 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active (30 days)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active_last_30_days}</p>
              </div>
              <ActivityIcon className="w-10 h-10 text-orange-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Never Logged In</p>
                <p className="text-3xl font-bold text-gray-900">{stats.never_logged_in}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </Card>
        </div>

        <Card className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Inactive 30 days</p>
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive_30_days}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.inactive_30_days / stats.total_users) * 100).toFixed(1)}% of all users
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Inactive 60 days</p>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive_60_days}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.inactive_60_days / stats.total_users) * 100).toFixed(1)}% of all users
              </p>
            </div>

            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Inactive 90+ days</p>
                <TrendingDown className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive_90_days}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.inactive_90_days / stats.total_users) * 100).toFixed(1)}% of all users
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Inactive Accounts</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod(30)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 30
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setSelectedPeriod(60)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 60
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                60 Days
              </button>
              <button
                onClick={() => setSelectedPeriod(90)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 90
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          {inactiveUsers.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No inactive users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Health Score
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inactiveUsers.map((user) => {
                    const health = getHealthScore(user);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getLastLoginDisplay(user.last_login)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full bg-${health.color}-600`}
                                style={{ width: `${health.score}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium text-${health.color}-700`}>
                              {health.score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={user.is_suspended ? 'danger' : 'success'}>
                            {user.is_suspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
