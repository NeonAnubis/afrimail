'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Copy, HardDrive, Mail, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatBytes } from '@/lib/utils';

interface UserTemplate {
  id: string;
  name: string;
  description: string;
  quota_bytes: number;
  permissions: {
    can_send_external: boolean;
    can_use_imap: boolean;
    can_use_smtp: boolean;
    can_create_aliases: boolean;
    max_aliases: number;
  };
  is_system_template: boolean;
  created_at: string;
}

const DEFAULT_PERMISSIONS = {
  can_send_external: true,
  can_use_imap: true,
  can_use_smtp: true,
  can_create_aliases: true,
  max_aliases: 5,
};

const QUOTA_PRESETS = [
  { label: '1 GB', value: 1073741824 },
  { label: '5 GB', value: 5368709120 },
  { label: '10 GB', value: 10737418240 },
  { label: '25 GB', value: 26843545600 },
  { label: '50 GB', value: 53687091200 },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quota_bytes: 5368709120,
    permissions: DEFAULT_PERMISSIONS,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.get<UserTemplate[]>('/admin/templates');
      setTemplates(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newTemplate = await ApiClient.post<UserTemplate>('/admin/templates', formData);
      setTemplates([...templates, newTemplate]);
      setShowModal(false);
      resetForm();
      setToast({ message: 'Template created successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      const updated = await ApiClient.put<UserTemplate>(`/admin/templates/${selectedTemplate.id}`, formData);
      setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? updated : t)));
      setShowModal(false);
      setSelectedTemplate(null);
      resetForm();
      setToast({ message: 'Template updated successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDeleteTemplate = async (template: UserTemplate) => {
    if (template.is_system_template) {
      setToast({ message: 'Cannot delete system templates', type: 'error' });
      return;
    }
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      await ApiClient.delete(`/admin/templates/${template.id}`);
      setTemplates(templates.filter((t) => t.id !== template.id));
      setToast({ message: 'Template deleted successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDuplicate = (template: UserTemplate) => {
    setSelectedTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description,
      quota_bytes: template.quota_bytes,
      permissions: { ...template.permissions },
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quota_bytes: 5368709120,
      permissions: DEFAULT_PERMISSIONS,
    });
  };

  const openEditModal = (template: UserTemplate) => {
    if (template.is_system_template) {
      setToast({ message: 'System templates cannot be edited. Use duplicate to create a copy.', type: 'error' });
      return;
    }
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      quota_bytes: template.quota_bytes,
      permissions: { ...template.permissions },
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedTemplate(null);
    resetForm();
    setShowModal(true);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Templates</h1>
            <p className="text-gray-600">
              Configure default settings for new user accounts
            </p>
          </div>
          <Button onClick={openCreateModal} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
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

                <p className="text-sm text-gray-600 mb-4">
                  {template.description || 'No description'}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HardDrive className="w-4 h-4" />
                    <span>Storage: {formatBytes(template.quota_bytes)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>
                      Max Aliases: {template.permissions.max_aliases}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.permissions.can_send_external && (
                      <Badge variant="success">External Email</Badge>
                    )}
                    {template.permissions.can_use_imap && (
                      <Badge variant="success">IMAP</Badge>
                    )}
                    {template.permissions.can_use_smtp && (
                      <Badge variant="success">SMTP</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="flex-1 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className={`flex-1 p-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      template.is_system_template
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                    disabled={template.is_system_template}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className={`flex-1 p-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      template.is_system_template
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    disabled={template.is_system_template}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Templates Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create templates to standardize user configurations
                  </p>
                  <Button onClick={openCreateModal} variant="primary">
                    Create First Template
                  </Button>
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
                  rows={2}
                  placeholder="Describe this template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Quota
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {QUOTA_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, quota_bytes: preset.value })}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.quota_bytes === preset.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Current: {formatBytes(formData.quota_bytes)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-3 border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_send_external}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_send_external: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Can send external emails
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_use_imap}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_use_imap: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Can use IMAP
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_use_smtp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_use_smtp: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Can use SMTP
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_create_aliases}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_create_aliases: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Can create aliases
                    </span>
                  </label>

                  {formData.permissions.can_create_aliases && (
                    <div className="ml-6">
                      <label className="block text-sm text-gray-700 mb-1">
                        Maximum Aliases
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.permissions.max_aliases}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              max_aliases: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
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
