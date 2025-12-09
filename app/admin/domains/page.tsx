'use client';

import React, { useEffect, useState } from 'react';
import { Globe, Plus, Edit2, Trash2, Check, X, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ApiClient } from '@/lib/api';
import { MailDomain } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function DomainsPage() {
  const [domains, setDomains] = useState<MailDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<MailDomain | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    domain: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.get<MailDomain[]>('/admin/domains');
      setDomains(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch domains';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newDomain = await ApiClient.post<MailDomain>('/admin/domains', formData);
      setDomains([...domains, newDomain]);
      setShowModal(false);
      resetForm();
      setToast({ message: 'Domain added successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add domain';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    try {
      const updated = await ApiClient.put<MailDomain>(
        `/admin/domains/${selectedDomain.id}`,
        formData
      );
      setDomains(domains.map((d) => (d.id === selectedDomain.id ? updated : d)));
      setShowModal(false);
      setSelectedDomain(null);
      resetForm();
      setToast({ message: 'Domain updated successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update domain';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDeleteDomain = async (domain: MailDomain) => {
    if (domain.is_primary) {
      setToast({ message: 'Cannot delete the primary domain', type: 'error' });
      return;
    }
    if (!confirm(`Delete domain "${domain.domain}"? This will affect all users with this domain.`)) return;

    try {
      await ApiClient.delete(`/admin/domains/${domain.id}`);
      setDomains(domains.filter((d) => d.id !== domain.id));
      setToast({ message: 'Domain deleted successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete domain';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleToggleActive = async (domain: MailDomain) => {
    try {
      const updated = await ApiClient.put<MailDomain>(`/admin/domains/${domain.id}`, {
        is_active: !domain.is_active,
      });
      setDomains(domains.map((d) => (d.id === domain.id ? updated : d)));
      setToast({
        message: `Domain ${domain.is_active ? 'deactivated' : 'activated'} successfully`,
        type: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update domain';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleSetPrimary = async (domain: MailDomain) => {
    if (domain.is_primary) return;
    if (!confirm(`Set "${domain.domain}" as the primary domain?`)) return;

    try {
      await ApiClient.put(`/admin/domains/${domain.id}/set-primary`, {});
      setDomains(
        domains.map((d) => ({
          ...d,
          is_primary: d.id === domain.id,
        }))
      );
      setToast({ message: 'Primary domain updated', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set primary domain';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      domain: '',
      description: '',
      is_active: true,
    });
  };

  const openEditModal = (domain: MailDomain) => {
    setSelectedDomain(domain);
    setFormData({
      domain: domain.domain,
      description: domain.description || '',
      is_active: domain.is_active,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedDomain(null);
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

  const activeDomains = domains.filter((d) => d.is_active);
  const inactiveDomains = domains.filter((d) => !d.is_active);
  const primaryDomain = domains.find((d) => d.is_primary);

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[{ label: 'Domain Management' }]} />

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Management</h1>
            <p className="text-gray-600">
              Configure email domains for your organization
            </p>
          </div>
          <Button onClick={openCreateModal} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Domains</p>
                <p className="text-3xl font-bold text-gray-900">{domains.length}</p>
              </div>
              <Globe className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Domains</p>
                <p className="text-3xl font-bold text-gray-900">{activeDomains.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Primary Domain</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {primaryDomain?.domain || 'Not set'}
                </p>
              </div>
              <Star className="w-10 h-10 text-yellow-500" />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      domain.is_active ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <Globe
                      className={`w-6 h-6 ${
                        domain.is_active ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {domain.domain}
                      </h3>
                      {domain.is_primary && (
                        <Badge variant="warning">
                          <Star className="w-3 h-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      <Badge variant={domain.is_active ? 'success' : 'danger'}>
                        {domain.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {domain.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {domain.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Added {new Date(domain.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!domain.is_primary && domain.is_active && (
                    <button
                      onClick={() => handleSetPrimary(domain)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleActive(domain)}
                    className={`p-2 rounded-lg transition-colors ${
                      domain.is_active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={domain.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {domain.is_active ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(domain)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  {!domain.is_primary && (
                    <button
                      onClick={() => handleDeleteDomain(domain)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {domains.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Domains Configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first email domain to get started
                </p>
                <Button onClick={openCreateModal} variant="primary">
                  Add First Domain
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedDomain ? 'Edit Domain' : 'Add Domain'}
        >
          <form onSubmit={selectedDomain ? handleUpdateDomain : handleCreateDomain}>
            <div className="space-y-4">
              <Input
                label="Domain Name"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
                placeholder="e.g., mail.example.com"
                disabled={!!selectedDomain}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Add a description for this domain..."
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Domain is active</span>
              </label>

              {!selectedDomain && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">DNS Configuration Required</p>
                      <p>
                        After adding the domain, you&apos;ll need to configure DNS records
                        (MX, SPF, DKIM, DMARC) for email to work properly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  {selectedDomain ? 'Update Domain' : 'Add Domain'}
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
