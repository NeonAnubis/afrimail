import React, { useEffect, useState } from 'react';
import { Layers, Plus, Edit2, Trash2, Copy, Search, Users, Settings, TrendingUp, ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { ApiClient } from '../../lib/api';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { StatCard } from '../../components/ui/StatCard';

interface UserTemplate {
  id: string;
  name: string;
  description: string;
  quota_bytes: number;
  permissions: Record<string, boolean>;
  is_system_template: boolean;
  created_at: string;
  user_count?: number;
}

const PERMISSION_OPTIONS = [
  { key: 'compose_mail', label: 'Compose & Send Mail', description: 'Send emails to other users' },
  { key: 'create_aliases', label: 'Create Email Aliases', description: 'Create custom email aliases' },
  { key: 'join_groups', label: 'Join User Groups', description: 'Join and participate in groups' },
  { key: 'manage_filters', label: 'Manage Email Filters', description: 'Create inbox filtering rules' },
  { key: 'access_api', label: 'API Access', description: 'Use REST API for automation' },
  { key: 'advanced_search', label: 'Advanced Search', description: 'Use advanced search features' },
  { key: 'export_data', label: 'Export Data', description: 'Export mailbox data' },
  { key: 'custom_themes', label: 'Custom Themes', description: 'Customize interface appearance' },
  { key: 'priority_support', label: 'Priority Support', description: 'Access to priority support' },
];

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'users' | 'quota' | 'date'>('name');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quota_gb: '5',
  });

  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    const defaultPermissions: Record<string, boolean> = {};
    PERMISSION_OPTIONS.forEach(opt => {
      defaultPermissions[opt.key] = false;
    });
    return defaultPermissions;
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.get<UserTemplate[]>('/admin/templates');
      setTemplates(data);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch templates', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const quotaBytes = parseFloat(formData.quota_gb) * 1024 * 1024 * 1024;
      const newTemplate = await ApiClient.post<UserTemplate>('/admin/templates', {
        name: formData.name,
        description: formData.description,
        quota_bytes: quotaBytes,
        permissions,
      });

      setTemplates([...templates, { ...newTemplate, user_count: 0 }]);
      setShowModal(false);
      resetForm();
      setToast({ message: 'Template created successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to create template', type: 'error' });
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      const quotaBytes = parseFloat(formData.quota_gb) * 1024 * 1024 * 1024;
      const updated = await ApiClient.put<UserTemplate>(`/admin/templates/${selectedTemplate.id}`, {
        name: formData.name,
        description: formData.description,
        quota_bytes: quotaBytes,
        permissions,
      });

      setTemplates(templates.map((t) =>
        t.id === selectedTemplate.id
          ? { ...updated, user_count: selectedTemplate.user_count }
          : t
      ));
      setShowModal(false);
      resetForm();
      setToast({ message: 'Template updated successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update template', type: 'error' });
    }
  };

  const handleDeleteTemplate = async (template: UserTemplate) => {
    if (template.is_system_template) {
      setToast({ message: 'Cannot delete system templates', type: 'error' });
      return;
    }

    if (template.user_count && template.user_count > 0) {
      if (!confirm(`This template has ${template.user_count} users. Deleting it will remove their template assignment. Continue?`)) {
        return;
      }
    }

    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      await ApiClient.delete(`/admin/templates/${template.id}`);
      setTemplates(templates.filter((t) => t.id !== template.id));
      setToast({ message: 'Template deleted successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete template', type: 'error' });
    }
  };

  const handleCloneTemplate = async (template: UserTemplate) => {
    try {
      const quotaBytes = template.quota_bytes;
      const newTemplate = await ApiClient.post<UserTemplate>('/admin/templates', {
        name: `${template.name} (Copy)`,
        description: template.description,
        quota_bytes: quotaBytes,
        permissions: template.permissions,
      });

      setTemplates([...templates, { ...newTemplate, user_count: 0 }]);
      setToast({ message: 'Template cloned successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to clone template', type: 'error' });
    }
  };

  const openEditModal = (template: UserTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      quota_gb: (template.quota_bytes / (1024 * 1024 * 1024)).toString(),
    });
    setPermissions(template.permissions || {});
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openPermissionsModal = (template: UserTemplate) => {
    setSelectedTemplate(template);
    setShowPermissionsModal(true);
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({ name: '', description: '', quota_gb: '5' });
    const defaultPermissions: Record<string, boolean> = {};
    PERMISSION_OPTIONS.forEach(opt => {
      defaultPermissions[opt.key] = false;
    });
    setPermissions(defaultPermissions);
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(gb < 1 ? 2 : 0)} GB`;
  };

  const getFilteredAndSortedTemplates = () => {
    let filtered = templates.filter(template => {
      const matchesSearch = searchTerm === '' ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' ||
        (filterType === 'system' && template.is_system_template) ||
        (filterType === 'custom' && !template.is_system_template);

      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'users':
          return (b.user_count || 0) - (a.user_count || 0);
        case 'quota':
          return b.quota_bytes - a.quota_bytes;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStats = () => {
    const totalUsers = templates.reduce((sum, t) => sum + (t.user_count || 0), 0);
    const mostPopular = templates.length > 0
      ? templates.reduce((max, t) => ((t.user_count || 0) > (max.user_count || 0) ? t : max), templates[0])
      : null;
    const customTemplates = templates.filter(t => !t.is_system_template).length;

    return {
      totalTemplates: templates.length,
      totalUsers,
      mostPopular,
      customTemplates,
    };
  };

  const getActivePermissionsCount = (perms: Record<string, boolean>) => {
    return Object.values(perms).filter(v => v === true).length;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  const stats = getStats();
  const filteredTemplates = getFilteredAndSortedTemplates();

  return (
    <AdminLayout>
      <div>
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Templates</h1>
            <p className="text-gray-600">
              Create templates for quickly onboarding new users with predefined settings
            </p>
          </div>
          <Button onClick={openCreateModal} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {templates.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title="Total Templates"
              value={stats.totalTemplates}
              icon={Layers}
            />
            <StatCard
              title="Users Assigned"
              value={stats.totalUsers}
              icon={Users}
            />
            <StatCard
              title="Custom Templates"
              value={stats.customTemplates}
              icon={Settings}
            />
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Most Popular</span>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                {stats.mostPopular ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.mostPopular.name}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.mostPopular.user_count || 0} users
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-400">N/A</div>
                )}
              </div>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'system' | 'custom')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Templates</option>
                <option value="system">System Only</option>
                <option value="custom">Custom Only</option>
              </select>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="name">Sort by Name</option>
                  <option value="users">Sort by Users</option>
                  <option value="quota">Sort by Quota</option>
                  <option value="date">Sort by Date</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {(searchTerm || filterType !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredTemplates.length} of {templates.length} templates
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Layers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      {template.is_system_template && (
                        <Badge variant="default">System</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Storage Quota:</span>
                    <span className="font-medium text-gray-900">
                      {formatBytes(template.quota_bytes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Permissions:</span>
                    <button
                      onClick={() => openPermissionsModal(template)}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {getActivePermissionsCount(template.permissions)} active
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium text-gray-900">
                      {template.user_count || 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCloneTemplate(template)}
                    className="flex-1 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    title="Clone template"
                  >
                    <Copy className="w-4 h-4" />
                    Clone
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex-1 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  {!template.is_system_template && (
                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      className="flex-1 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-12">
                  <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {templates.length === 0 ? 'No Templates Yet' : 'No Templates Found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {templates.length === 0
                      ? 'Create your first user template to streamline user onboarding'
                      : 'Try adjusting your filters to see more results'}
                  </p>
                  {templates.length === 0 ? (
                    <Button onClick={openCreateModal} variant="primary">
                      Create First Template
                    </Button>
                  ) : (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedTemplate ? 'Edit Template' : 'Create Template'}
        >
          <form onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}>
            <div className="space-y-4">
              <Input
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Standard User, Premium User"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this template..."
                />
              </div>

              <Input
                label="Storage Quota (GB)"
                type="number"
                min="0.5"
                max="1000"
                step="0.5"
                value={formData.quota_gb}
                onChange={(e) => setFormData({ ...formData, quota_gb: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {PERMISSION_OPTIONS.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[option.key] || false}
                        onChange={(e) => setPermissions({
                          ...permissions,
                          [option.key]: e.target.checked,
                        })}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {getActivePermissionsCount(permissions)} permissions enabled
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  {selectedTemplate ? 'Update Template' : 'Create Template'}
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

        <Modal
          isOpen={showPermissionsModal}
          onClose={() => setShowPermissionsModal(false)}
          title={`${selectedTemplate?.name} - Permissions`}
        >
          <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {PERMISSION_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center ${
                    selectedTemplate?.permissions[option.key]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300'
                  }`}>
                    {selectedTemplate?.permissions[option.key] && (
                      <span className="text-xs">✓</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      selectedTemplate?.permissions[option.key]
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTemplate && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {getActivePermissionsCount(selectedTemplate.permissions)} of {PERMISSION_OPTIONS.length} permissions enabled
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPermissionsModal(false)}
            >
              Close
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
};
