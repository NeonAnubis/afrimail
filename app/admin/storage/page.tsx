'use client';

import React, { useEffect, useState } from 'react';
import { HardDrive, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { StorageStatsExtended, QuotaPreset } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function StoragePage() {
  const [stats, setStats] = useState<StorageStatsExtended | null>(null);
  const [presets, setPresets] = useState<QuotaPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newQuota, setNewQuota] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storageData, presetsData] = await Promise.all([
        ApiClient.get<StorageStatsExtended>('/admin/storage/stats'),
        ApiClient.get<{ presets: QuotaPreset[] }>('/admin/storage/presets'),
      ]);
      setStats(storageData);
      setPresets(presetsData.presets);
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleQuotaChange = async (email: string, quotaBytes: number) => {
    try {
      await ApiClient.put(`/admin/users/${email}/quota`, { quota_bytes: quotaBytes });
      setToast({ message: 'Quota updated successfully', type: 'success' });
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quota';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  const usagePercent = (stats.total_used / stats.total_allocated) * 100;

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Storage & Quota Management</h1>
        <p className="text-gray-600 mb-8">Monitor storage usage and manage user quotas</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
                <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.total_allocated)}</p>
              </div>
              <HardDrive className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Used</p>
                <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.total_used)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Usage</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_usage_percent.toFixed(1)}%</p>
              </div>
              <Users className="w-10 h-10 text-orange-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Over 90% Full</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users_over_90_percent}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </Card>
        </div>

        <Card className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Storage Usage</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                {formatBytes(stats.total_used)} of {formatBytes(stats.total_allocated)} used
              </span>
              <span className="font-semibold text-gray-900">{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usagePercent > 90 ? 'bg-red-600' : usagePercent > 75 ? 'bg-orange-600' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Quota Presets</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <p className="font-semibold text-gray-900">{preset.name}</p>
                  <p className="text-sm text-gray-600">{formatBytes(preset.value)}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              <AlertTriangle className="w-5 h-5 inline mr-2 text-orange-600" />
              Quota Warnings
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {stats.users_over_90_percent} users are using more than 90% of their quota
            </p>
            {stats.users_over_90_percent > 0 && (
              <div className="space-y-2">
                {stats.top_users.filter(u => u.usage_percent >= 90).slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <span className="text-sm text-gray-900 truncate flex-1">{user.email}</span>
                    <Badge variant="warning">{user.usage_percent.toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Storage Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Usage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quota</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.top_users.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatBytes(user.usage_bytes)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatBytes(user.quota_bytes)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        variant={
                          user.usage_percent >= 90
                            ? 'danger'
                            : user.usage_percent >= 75
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {user.usage_percent.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user.email);
                          setIsModalOpen(true);
                        }}
                      >
                        Adjust Quota
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adjust User Quota">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">User</p>
              <p className="font-semibold text-gray-900">{selectedUser}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setNewQuota(preset.value.toString())}
                  className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-semibold text-sm text-gray-900">{preset.name}</p>
                  <p className="text-xs text-gray-600">{formatBytes(preset.value)}</p>
                </button>
              ))}
            </div>

            <Input
              type="number"
              label="Custom Quota (GB)"
              placeholder="Enter quota in GB"
              value={newQuota ? (parseInt(newQuota) / 1024 / 1024 / 1024).toString() : ''}
              onChange={(e) => setNewQuota((parseFloat(e.target.value) * 1024 * 1024 * 1024).toString())}
            />

            <Button
              fullWidth
              onClick={() => selectedUser && newQuota && handleQuotaChange(selectedUser, parseInt(newQuota))}
              disabled={!newQuota}
            >
              Update Quota
            </Button>
          </div>
        </Modal>

        {toast && (
          <ToastContainer>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </ToastContainer>
        )}
      </div>
    </AdminLayout>
  );
}
