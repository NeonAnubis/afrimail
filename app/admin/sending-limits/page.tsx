'use client';

import React, { useEffect, useState } from 'react';
import { Mail, AlertTriangle, Users, DollarSign, Search, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { formatNumber, getUsageColor } from '@/lib/utils';
import { EmailSendingLimit, SendingLimitStats, SendingLimitViolation } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function SendingLimitsPage() {
  const [stats, setStats] = useState<SendingLimitStats | null>(null);
  const [users, setUsers] = useState<EmailSendingLimit[]>([]);
  const [violations, setViolations] = useState<SendingLimitViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'at-limit' | 'near-limit' | 'free-tier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<EmailSendingLimit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showViolations, setShowViolations] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, usersData, violationsData] = await Promise.all([
        ApiClient.get<SendingLimitStats>('/admin/sending-limits/stats'),
        ApiClient.get<EmailSendingLimit[]>(`/admin/sending-limits/users${filter !== 'all' ? `?filter=${filter}` : ''}`),
        ApiClient.get<SendingLimitViolation[]>('/admin/sending-limits/violations'),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setViolations(violationsData.filter((v) => !v.is_resolved));
    } catch (error) {
      console.error('Failed to fetch sending limits data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLimit = async (userId: string) => {
    try {
      await ApiClient.post(`/admin/sending-limits/users/${userId}/reset`, {});
      setToast({ message: 'Daily limit reset successfully', type: 'success' });
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset limit';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleSuspendSending = async (userId: string, reason: string) => {
    try {
      await ApiClient.post(`/admin/sending-limits/users/${userId}/suspend-sending`, { reason });
      setToast({ message: 'User sending suspended', type: 'success' });
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to suspend sending';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleResumeSending = async (userId: string) => {
    try {
      await ApiClient.post(`/admin/sending-limits/users/${userId}/resume-sending`, {});
      setToast({ message: 'User sending resumed', type: 'success' });
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume sending';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleUpdateLimit = async (userId: string, dailyLimit: number, tierName: string) => {
    try {
      await ApiClient.put(`/admin/sending-limits/users/${userId}/limit`, {
        daily_limit: dailyLimit,
        tier_name: tierName,
      });
      setToast({ message: 'Limit updated successfully', type: 'success' });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update limit';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleResolveViolation = async (violationId: string) => {
    try {
      await ApiClient.put(`/admin/sending-limits/violations/${violationId}/resolve`, {
        resolved_by: 'admin',
        admin_notes: 'Resolved via admin panel',
      });
      setToast({ message: 'Violation marked as resolved', type: 'success' });
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve violation';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const getUsageBadgeVariant = (usagePercent: number): 'default' | 'success' | 'warning' | 'danger' => {
    if (usagePercent >= 95) return 'danger';
    if (usagePercent >= 80) return 'warning';
    return 'default';
  };

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Breadcrumb items={[{ label: 'Sending Limits & Abuse Prevention' }]} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sending Limits & Abuse Prevention</h1>
            <p className="text-gray-600 mt-1">Monitor email sending activity and prevent abuse</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowViolations(!showViolations)}
              variant={showViolations ? 'primary' : 'outline'}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {showViolations ? 'Show Users' : 'Show Violations'}
            </Button>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Sent Today"
            value={formatNumber(stats.total_sent_today)}
            icon={Mail}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            subtitle="Total emails sent"
          />

          <StatCard
            title="Users at Limit"
            value={stats.users_at_limit}
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            subtitle={`${stats.users_near_limit} approaching limit`}
          />

          <StatCard
            title="Active Violations"
            value={stats.active_violations}
            icon={AlertTriangle}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            subtitle="Require attention"
          />

          <StatCard
            title="Revenue Opportunity"
            value={stats.revenue_opportunity_count}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            subtitle="Free users at limit"
          />
        </div>

        {showViolations ? (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Violations</h2>
              {violations.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active violations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <div
                      key={violation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-900">{violation.email}</p>
                            <Badge variant="danger">{violation.violation_type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Attempted {violation.attempted_count} emails (limit: {violation.limit_at_time})
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(violation.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleResolveViolation(violation.id)}
                          variant="outline"
                          size="sm"
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by email or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setFilter('all')}
                      variant={filter === 'all' ? 'primary' : 'outline'}
                      size="sm"
                    >
                      All Users
                    </Button>
                    <Button
                      onClick={() => setFilter('at-limit')}
                      variant={filter === 'at-limit' ? 'primary' : 'outline'}
                      size="sm"
                    >
                      At Limit
                    </Button>
                    <Button
                      onClick={() => setFilter('near-limit')}
                      variant={filter === 'near-limit' ? 'primary' : 'outline'}
                      size="sm"
                    >
                      Near Limit
                    </Button>
                    <Button
                      onClick={() => setFilter('free-tier')}
                      variant={filter === 'free-tier' ? 'primary' : 'outline'}
                      size="sm"
                    >
                      Free Tier
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">User</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Tier</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Sent Today</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Limit</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Usage</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No users found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{user.email}</p>
                                {user.name && <p className="text-sm text-gray-600">{user.name}</p>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={user.tier_name === 'free' ? 'default' : 'success'}>
                                {user.tier_name}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-sm">
                              {user.emails_sent_today}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-sm">
                              {user.daily_limit}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-semibold ${getUsageColor(user.usage_percent)}`}>
                                {user.usage_percent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {user.is_sending_enabled ? (
                                <Badge variant={getUsageBadgeVariant(user.usage_percent)}>
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="danger">Suspended</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsModalOpen(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Manage
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </>
        )}

        {isModalOpen && selectedUser && (
          <UserLimitModal
            user={selectedUser}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUser(null);
            }}
            onReset={() => handleResetLimit(selectedUser.user_id)}
            onSuspend={(reason) => handleSuspendSending(selectedUser.user_id, reason)}
            onResume={() => handleResumeSending(selectedUser.user_id)}
            onUpdateLimit={(dailyLimit, tierName) =>
              handleUpdateLimit(selectedUser.user_id, dailyLimit, tierName)
            }
          />
        )}

        <ToastContainer>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </ToastContainer>
      </div>
    </AdminLayout>
  );
}

interface UserLimitModalProps {
  user: EmailSendingLimit;
  onClose: () => void;
  onReset: () => void;
  onSuspend: (reason: string) => void;
  onResume: () => void;
  onUpdateLimit: (dailyLimit: number, tierName: string) => void;
}

const UserLimitModal: React.FC<UserLimitModalProps> = ({
  user,
  onClose,
  onReset,
  onSuspend,
  onResume,
  onUpdateLimit,
}) => {
  const [dailyLimit, setDailyLimit] = useState(user.daily_limit.toString());
  const [tierName, setTierName] = useState(user.tier_name);
  const [suspendReason, setSuspendReason] = useState('');

  return (
    <Modal isOpen={true} onClose={onClose} title="Manage Sending Limits">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Email:</span> {user.email}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Current Tier:</span>{' '}
              <Badge variant={user.tier_name === 'free' ? 'default' : 'success'}>{user.tier_name}</Badge>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Sent Today:</span> {user.emails_sent_today} /{' '}
              {user.daily_limit}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Usage:</span>{' '}
              <span className="font-semibold">{user.usage_percent.toFixed(1)}%</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Update Limits</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="free">Free (50/day)</option>
                <option value="basic">Basic (500/day)</option>
                <option value="premium">Premium (2000/day)</option>
                <option value="enterprise">Enterprise (Unlimited)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Limit (Custom)
              </label>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="Enter daily limit"
              />
            </div>

            <Button
              onClick={() => onUpdateLimit(parseInt(dailyLimit), tierName)}
              className="w-full"
            >
              Update Limits
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-3">
            <Button onClick={onReset} variant="outline" className="w-full">
              Reset Daily Counter
            </Button>

            {user.is_sending_enabled ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Reason for suspension..."
                />
                <Button
                  onClick={() => onSuspend(suspendReason || 'Suspended by admin')}
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  Suspend Sending
                </Button>
              </div>
            ) : (
              <Button onClick={onResume} variant="outline" className="w-full text-green-600 border-green-300 hover:bg-green-50">
                Resume Sending
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
