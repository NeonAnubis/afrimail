import React, { useEffect, useState } from 'react';
import { Search, UserX, UserCheck, Key, Settings, Download, User as UserIcon, Mail, Clock, HardDrive, FileUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { ApiClient } from '../../lib/api';
import { formatBytes, formatDate, getInitials } from '../../lib/utils';
import { User } from '../../types';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { BulkActionsToolbar } from '../../components/BulkActionsToolbar';
import { CSVImportModal } from '../../components/CSVImportModal';

interface UserWithStats extends Omit<User, 'last_login'> {
  quota_bytes?: number;
  usage_bytes?: number;
  last_login?: string | null;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) =>
        statusFilter === 'active' ? !user.is_suspended : user.is_suspended
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      const data = await ApiClient.get<User[]>('/admin/users');
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await ApiClient.get<any[]>('/admin/groups');
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleAddToGroup = async (groupId: string) => {
    try {
      await ApiClient.post(`/admin/groups/${groupId}/members/add`, {
        user_ids: Array.from(selectedUserIds),
      });
      setToast({ message: 'Users added to group successfully', type: 'success' });
      setShowGroupModal(false);
      setSelectedUserIds(new Set());
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to add users to group', type: 'error' });
    }
  };

  const handleSuspend = async (email: string) => {
    try {
      await ApiClient.put(`/admin/users/${email}/suspend`, {});
      setToast({ message: 'User suspended successfully', type: 'success' });
      fetchUsers();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to suspend user', type: 'error' });
    }
  };

  const handleUnsuspend = async (email: string) => {
    try {
      await ApiClient.put(`/admin/users/${email}/unsuspend`, {});
      setToast({ message: 'User unsuspended successfully', type: 'success' });
      fetchUsers();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to unsuspend user', type: 'error' });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const response = await ApiClient.post<{ temporary_password: string }>(
        `/admin/users/${email}/reset-password`,
        {}
      );
      setToast({
        message: `Password reset. Temp password: ${response.temporary_password}`,
        type: 'success',
      });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to reset password', type: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const csv = await ApiClient.get<string>('/admin/users/export/users');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to export users', type: 'error' });
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.is_suspended).length,
    suspended: users.filter((u) => u.is_suspended).length,
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[{ label: 'User Management' }]} />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage all user accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowImportModal(true)} variant="secondary">
              <FileUp className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={UserIcon}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Active Users"
            value={stats.active}
            icon={UserCheck}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Suspended"
            value={stats.suspended}
            icon={UserX}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search users..."
                icon={<Search className="w-5 h-5" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'suspended'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>

          {isLoading ? (
            <Loading />
          ) : (
            <>
              {filteredUsers.length > 0 && (
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({filteredUsers.length})
                  </span>
                </div>
              )}
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const usagePercent = user.quota_bytes && user.usage_bytes
                    ? (user.usage_bytes / user.quota_bytes) * 100
                    : 0;

                  return (
                    <div
                      key={user.id}
                      className={`p-6 border rounded-lg hover:shadow-md transition-all ${
                        selectedUserIds.has(user.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="mt-2 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                          {getInitials(user.first_name, user.last_name)}
                        </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </h3>
                          <Badge variant={user.is_suspended ? 'danger' : 'success'}>
                            {user.is_suspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {user.last_login
                                ? `Active ${formatDate(user.last_login)}`
                                : 'Never logged in'}
                            </span>
                          </div>
                        </div>

                        {user.quota_bytes && user.usage_bytes !== undefined && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <div className="flex items-center gap-2 text-gray-600">
                                <HardDrive className="w-4 h-4" />
                                <span>Storage</span>
                              </div>
                              <span className="font-medium text-gray-900">
                                {formatBytes(user.usage_bytes)} / {formatBytes(user.quota_bytes)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  usagePercent >= 90
                                    ? 'bg-red-600'
                                    : usagePercent >= 75
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {user.is_suspended ? (
                            <button
                              onClick={() => handleUnsuspend(user.email)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm"
                            >
                              <UserCheck className="w-4 h-4" />
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user.email)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                            >
                              <UserX className="w-4 h-4" />
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => handleResetPassword(user.email)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                          >
                            <Key className="w-4 h-4" />
                            Reset Password
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                          >
                            <Settings className="w-4 h-4" />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-600 py-12">No users found</p>
              )}
            </div>
            </>
          )}
        </Card>

        {selectedUser && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="User Details"
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-lg font-medium">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recovery Email</p>
                <p className="text-lg font-medium">
                  {selectedUser.recovery_email || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recovery Phone</p>
                <p className="text-lg font-medium">
                  {selectedUser.recovery_phone || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={selectedUser.is_suspended ? 'danger' : 'success'}>
                  {selectedUser.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
              </div>
            </div>
          </Modal>
        )}

        {selectedUserIds.size > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedUserIds.size}
            selectedUserIds={Array.from(selectedUserIds)}
            selectedEmails={users.filter((u) => selectedUserIds.has(u.id)).map((u) => u.email)}
            onActionComplete={() => {
              fetchUsers();
              setSelectedUserIds(new Set());
            }}
            onClearSelection={() => setSelectedUserIds(new Set())}
            onShowGroups={() => setShowGroupModal(true)}
          />
        )}

        <CSVImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            fetchUsers();
            setToast({ message: 'Users imported successfully', type: 'success' });
          }}
        />

        <Modal
          isOpen={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          title="Add to Group"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Add {selectedUserIds.size} selected user(s) to a group
            </p>

            {groups.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleAddToGroup(group.id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">{group.description}</p>
                      </div>
                      <Badge variant="default">{group.member_count} members</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No groups available. Create groups first.
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </Button>
          </div>
        </Modal>

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
    </AdminLayout>
  );
};
