'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { ScheduledAction } from '@/types';

const ACTION_TYPES = [
  { value: 'suspend', label: 'Suspend Users', color: 'yellow' },
  { value: 'unsuspend', label: 'Unsuspend Users', color: 'green' },
  { value: 'delete', label: 'Delete Users', color: 'red' },
  { value: 'quota_change', label: 'Change Quota', color: 'blue' },
  { value: 'warning', label: 'Send Warning', color: 'orange' },
];

export default function ScheduledActionsPage() {
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    action_type: 'suspend',
    scheduled_date: '',
    scheduled_time: '',
  });

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.get<ScheduledAction[]>('/admin/scheduled-actions');
      setActions(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch scheduled actions';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const scheduledFor = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString();

      const newAction = await ApiClient.post<ScheduledAction>('/admin/scheduled-actions', {
        action_type: formData.action_type,
        target_type: 'bulk_users',
        target_ids: [],
        scheduled_for: scheduledFor,
        action_data: {},
      });

      setActions([...actions, newAction]);
      setShowModal(false);
      setFormData({ action_type: 'suspend', scheduled_date: '', scheduled_time: '' });
      setToast({ message: 'Scheduled action created successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create scheduled action';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDeleteAction = async (action: ScheduledAction) => {
    if (!confirm('Delete this scheduled action?')) return;

    try {
      await ApiClient.delete(`/admin/scheduled-actions/${action.id}`);
      setActions(actions.filter((a) => a.id !== action.id));
      setToast({ message: 'Scheduled action deleted successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete scheduled action';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionTypeInfo = (type: string) => {
    return ACTION_TYPES.find((t) => t.value === type) || ACTION_TYPES[0];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default' as const,
      completed: 'success' as const,
      failed: 'danger' as const,
      cancelled: 'default' as const,
    };
    return variants[status as keyof typeof variants] || 'default';
  };

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Actions</h1>
            <p className="text-gray-600">
              Schedule actions to be performed automatically at specific times
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Action
          </Button>
        </div>

        <div className="space-y-4">
          {actions.map((action) => {
            const actionInfo = getActionTypeInfo(action.action_type);
            const isOverdue = isPast(action.scheduled_for) && action.status === 'pending';

            return (
              <Card key={action.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {actionInfo.label}
                          </h3>
                          <Badge variant={getStatusBadge(action.status)}>
                            {action.status}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="danger">Overdue</Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Scheduled for: {formatDateTime(action.scheduled_for)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              Target: {action.target_ids.length > 0
                                ? `${action.target_ids.length} user(s)`
                                : 'No targets specified'}
                            </span>
                          </div>

                          {action.action_data && Object.keys(action.action_data).length > 0 && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 mb-1">Action Data:</p>
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(action.action_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteAction(action)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {actions.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Scheduled Actions
                </h3>
                <p className="text-gray-600 mb-4">
                  Schedule actions to be performed automatically in the future
                </p>
                <Button onClick={() => setShowModal(true)} variant="primary">
                  Schedule First Action
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Schedule Action"
        >
          <form onSubmit={handleCreateAction}>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Note:</p>
                    <p>This demo creates a scheduled action without user selection. In production, you would select specific users or groups before scheduling.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={formData.action_type}
                  onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />

              <Input
                label="Time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                required
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Schedule Action
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
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
