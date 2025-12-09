'use client';

import React, { useEffect, useState } from 'react';
import { Shield, UserPlus, Edit2, Trash2, Power, Key, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AdminRole } from '@/types';

interface AdminUserWithRole {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  role_id: string;
  admin_roles: AdminRole;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUserWithRole[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [activeTab, setActiveTab] = useState<'admins' | 'roles'>('admins');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adminsData, rolesData] = await Promise.all([
        ApiClient.get<AdminUserWithRole[]>('/admin/admins'),
        ApiClient.get<AdminRole[]>('/admin/roles'),
      ]);
      setAdmins(adminsData);
      setRoles(rolesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name || !formData.password || !formData.role_id) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      const newAdmin = await ApiClient.post<AdminUserWithRole>('/admin/admins', formData);
      setAdmins([newAdmin, ...admins]);
      setShowAddModal(false);
      setFormData({ email: '', name: '', password: '', role_id: '', is_active: true });
      setToast({ message: 'Admin user created successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create admin';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      const updated = await ApiClient.put<AdminUserWithRole>(
        `/admin/admins/${selectedAdmin.id}`,
        formData
      );
      setAdmins(admins.map((a) => (a.id === selectedAdmin.id ? updated : a)));
      setShowEditModal(false);
      setSelectedAdmin(null);
      setFormData({ email: '', name: '', password: '', role_id: '', is_active: true });
      setToast({ message: 'Admin user updated successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update admin';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDeleteAdmin = async (admin: AdminUserWithRole) => {
    if (!confirm(`Are you sure you want to delete ${admin.name}?`)) return;

    try {
      await ApiClient.delete(`/admin/admins/${admin.id}`);
      setAdmins(admins.filter((a) => a.id !== admin.id));
      setToast({ message: 'Admin user deleted successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete admin';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleToggleAdmin = async (admin: AdminUserWithRole) => {
    try {
      await ApiClient.put(`/admin/admins/${admin.id}/toggle`, {
        is_active: !admin.is_active,
      });
      setAdmins(
        admins.map((a) => (a.id === admin.id ? { ...a, is_active: !a.is_active } : a))
      );
      setToast({
        message: `Admin ${admin.is_active ? 'deactivated' : 'activated'} successfully`,
        type: 'success'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle admin status';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const openEditModal = (admin: AdminUserWithRole) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      name: admin.name,
      password: '',
      role_id: admin.role_id,
      is_active: admin.is_active,
    });
    setShowEditModal(true);
  };

  const openRoleModal = (role: AdminRole) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
          <p className="text-gray-600">Manage admin users and roles</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('admins')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admins'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admin Users ({admins.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles & Permissions ({roles.length})
            </button>
          </nav>
        </div>

        {activeTab === 'admins' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Admin Users</h2>
              </div>
              <Button onClick={() => setShowAddModal(true)} variant="primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Admin User
              </Button>
            </div>

            <div className="grid gap-4">
              {admins.map((admin) => (
                <Card key={admin.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                          {!admin.is_active && <Badge variant="danger">Inactive</Badge>}
                          <Badge variant="default">{admin.admin_roles?.name || 'No role'}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Created: {formatDate(admin.created_at)}</span>
                          {admin.last_login && (
                            <span>Last login: {formatDate(admin.last_login)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(admin)}
                        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                          admin.is_active ? 'text-yellow-600' : 'text-green-600'
                        }`}
                        title={admin.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              {admins.length === 0 && (
                <Card>
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Admin Users</h3>
                    <p className="text-gray-600 mb-4">Get started by creating an admin user</p>
                    <Button onClick={() => setShowAddModal(true)} variant="primary">
                      Add First Admin
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {activeTab === 'roles' && (
          <>
            <div className="mb-6 flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Roles & Permissions</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                        {role.is_system_role && (
                          <Badge variant="default">System Role</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                    </div>
                    <button
                      onClick={() => openRoleModal(role)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 uppercase">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(role.permissions).slice(0, 5).map((perm) => (
                        <Badge key={perm} variant="success">
                          {perm}
                        </Badge>
                      ))}
                      {Object.keys(role.permissions).length > 5 && (
                        <Badge variant="default">
                          +{Object.keys(role.permissions).length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    {admins.filter((a) => a.role_id === role.id).length} admin(s) assigned
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Admin User">
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" variant="primary" className="flex-1">
                Create Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Admin User"
        >
          <form onSubmit={handleUpdateAdmin} className="space-y-4">
            <Input label="Email" value={formData.email} disabled />
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="New Password (leave empty to keep current)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" variant="primary" className="flex-1">
                Update Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title={selectedRole?.name || 'Role Details'}
        >
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedRole.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(selectedRole.permissions).map(([category, perms]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-2 capitalize">{category}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {typeof perms === 'object' && perms !== null ? (
                          Object.entries(perms as Record<string, boolean>).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  allowed ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {action.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                perms ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                            <span className="text-sm text-gray-700">Enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">System Role:</span>
                  <Badge variant={selectedRole.is_system_role ? 'default' : 'success'}>
                    {selectedRole.is_system_role ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRoleModal(false)}
              >
                Close
              </Button>
            </div>
          )}
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
}
