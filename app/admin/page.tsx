'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  UserX,
  Globe,
  HardDrive,
  Activity,
  AlertCircle,
  Mail,
  Clock,
  LifeBuoy,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { ApiClient } from '@/lib/api';
import { formatBytes, formatDate, formatActionType } from '@/lib/utils';
import { Stats, StorageStats, ActivityStats, AuditLog, SupportTicket, AdminUser } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatAuditDetails = (details: unknown): string => {
    if (typeof details === 'string') return details;
    if (!details || typeof details !== 'object') return 'No details';

    const entries = Object.entries(details as Record<string, unknown>)
      .map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ');
        return `${formattedKey}: ${value}`;
      })
      .join(', ');

    return entries || 'No details';
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [adminData, statsData, storageData, activityData, ticketsData, logsData] = await Promise.all([
          ApiClient.get<AdminUser>('/auth/me'),
          ApiClient.get<Stats>('/admin/stats'),
          ApiClient.get<StorageStats>('/admin/storage/stats'),
          ApiClient.get<ActivityStats>('/admin/activity/stats'),
          ApiClient.get<SupportTicket[]>('/admin/support/tickets'),
          ApiClient.get<AuditLog[]>('/admin/audit-logs'),
        ]);

        setAdmin(adminData);
        setStats(statsData);
        setStorageStats(storageData);
        setActivityStats(activityData);
        setRecentTickets(ticketsData.slice(0, 5));
        setRecentLogs(logsData.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  const storagePercent = storageStats
    ? (storageStats.total_used / storageStats.total_allocated) * 100
    : 0;

  return (
    <AdminLayout admin={admin ? { email: admin.email, name: admin.name } : undefined}>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your mail system</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            subtitle={`${activityStats?.never_logged_in || 0} never logged in`}
            onClick={() => router.push('/admin/users')}
          />

          <StatCard
            title="Active Users"
            value={stats?.active_users || 0}
            icon={UserCheck}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            subtitle={`${activityStats?.active_last_7_days || 0} last 7 days`}
            onClick={() => router.push('/admin/users')}
          />

          <StatCard
            title="Suspended"
            value={stats?.suspended_users || 0}
            icon={UserX}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            subtitle="Accounts locked"
            onClick={() => router.push('/admin/users?filter=suspended')}
          />

          <StatCard
            title="Mail Domains"
            value={stats?.total_domains || 0}
            icon={Globe}
            iconColor="text-slate-600"
            iconBgColor="bg-slate-100"
            subtitle="Active domains"
            onClick={() => router.push('/admin/domains')}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HardDrive className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Storage Overview</h3>
                  <p className="text-sm text-gray-600">System-wide storage usage</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Usage</span>
                  <span className="text-sm font-bold text-gray-900">
                    {storageStats ? formatBytes(storageStats.total_used) : '0 B'} /{' '}
                    {storageStats ? formatBytes(storageStats.total_allocated) : '0 B'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      storagePercent >= 90
                        ? 'bg-red-600'
                        : storagePercent >= 75
                        ? 'bg-yellow-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{storagePercent.toFixed(1)}% utilized</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Avg. Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {storageStats?.average_usage_percent.toFixed(1) || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Users Over 90%</p>
                  <p className="text-2xl font-bold text-red-600">
                    {storageStats?.users_over_90_percent || 0}
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/admin/storage')}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                View Storage Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
                  <p className="text-sm text-gray-600">Recent login statistics</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Last 7 Days</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {activityStats?.active_last_7_days || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {activityStats?.active_last_30_days || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Never Logged In</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {activityStats?.never_logged_in || 0}
                </span>
              </div>

              <button
                onClick={() => router.push('/admin/activity')}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                View Activity Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <LifeBuoy className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Support Tickets</h3>
              </div>
              <button
                onClick={() => router.push('/admin/support')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{ticket.user_email}</span>
                      </div>
                      <Badge
                        variant={
                          ticket.status === 'open'
                            ? 'warning'
                            : ticket.status === 'resolved'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{formatDate(ticket.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">No recent tickets</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Activity className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Admin Actions</h3>
              </div>
              <button
                onClick={() => router.push('/admin/audit-logs')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatActionType(log.action_type)}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                    </div>
                    {log.target_user_email && (
                      <p className="text-xs text-gray-600 mb-1">Target: {log.target_user_email}</p>
                    )}
                    <p className="text-xs text-gray-600">{formatAuditDetails(log.details)}</p>
                    <p className="text-xs text-gray-500 mt-1">by {log.admin_email}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">No recent actions</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
