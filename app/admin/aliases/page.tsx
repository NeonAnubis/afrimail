'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Plus, Edit2, Trash2, ArrowRight, Users, Search, Power } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ApiClient } from '@/lib/api';
import { EmailAlias } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function AliasesPage() {
  const [aliases, setAliases] = useState<EmailAlias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlias, setSelectedAlias] = useState<EmailAlias | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'alias' | 'list'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    alias_address: '',
    target_addresses: '',
    is_distribution_list: false,
    description: '',
    active: true,
  });

  useEffect(() => {
    fetchAliases();
  }, []);

  const fetchAliases = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.get<EmailAlias[]>('/admin/aliases');
      setAliases(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch aliases';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newAlias = await ApiClient.post<EmailAlias>('/admin/aliases', {
        alias_address: formData.alias_address,
        target_addresses: formData.target_addresses.split(',').map((addr) => addr.trim()),
        is_distribution_list: formData.is_distribution_list,
        description: formData.description,
        active: formData.active,
      });
      setAliases([...aliases, newAlias]);
      setShowModal(false);
      resetForm();
      setToast({ message: 'Alias created successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create alias';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleUpdateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlias) return;

    try {
      const updated = await ApiClient.put<EmailAlias>(`/admin/aliases/${selectedAlias.id}`, {
        target_addresses: formData.target_addresses.split(',').map((addr) => addr.trim()),
        is_distribution_list: formData.is_distribution_list,
        description: formData.description,
        active: formData.active,
      });
      setAliases(aliases.map((a) => (a.id === selectedAlias.id ? updated : a)));
      setShowModal(false);
      setSelectedAlias(null);
      resetForm();
      setToast({ message: 'Alias updated successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update alias';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDeleteAlias = async (alias: EmailAlias) => {
    if (!confirm(`Delete alias "${alias.alias_address}"?`)) return;

    try {
      await ApiClient.delete(`/admin/aliases/${alias.id}`);
      setAliases(aliases.filter((a) => a.id !== alias.id));
      setToast({ message: 'Alias deleted successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete alias';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleToggleActive = async (alias: EmailAlias) => {
    try {
      const updated = await ApiClient.put<EmailAlias>(`/admin/aliases/${alias.id}`, {
        active: !alias.active,
      });
      setAliases(aliases.map((a) => (a.id === alias.id ? updated : a)));
      setToast({
        message: `Alias ${alias.active ? 'deactivated' : 'activated'} successfully`,
        type: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update alias';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      alias_address: '',
      target_addresses: '',
      is_distribution_list: false,
      description: '',
      active: true,
    });
  };

  const openEditModal = (alias: EmailAlias) => {
    setSelectedAlias(alias);
    setFormData({
      alias_address: alias.alias_address,
      target_addresses: alias.target_addresses.join(', '),
      is_distribution_list: alias.is_distribution_list,
      description: alias.description || '',
      active: alias.active,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedAlias(null);
    resetForm();
    setShowModal(true);
  };

  const filteredAliases = aliases.filter((alias) => {
    const matchesSearch =
      alias.alias_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alias.target_addresses.some((addr) =>
        addr.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'list' && alias.is_distribution_list) ||
      (typeFilter === 'alias' && !alias.is_distribution_list);

    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  const regularAliases = aliases.filter((a) => !a.is_distribution_list);
  const distributionLists = aliases.filter((a) => a.is_distribution_list);

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[{ label: 'Email Aliases' }]} />

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Aliases & Distribution Lists</h1>
            <p className="text-gray-600">
              Create email forwarding rules and distribution lists
            </p>
          </div>
          <Button onClick={openCreateModal} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Alias
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Aliases</p>
                <p className="text-3xl font-bold text-gray-900">{aliases.length}</p>
              </div>
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Regular Aliases</p>
                <p className="text-3xl font-bold text-gray-900">{regularAliases.length}</p>
              </div>
              <ArrowRight className="w-10 h-10 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Distribution Lists</p>
                <p className="text-3xl font-bold text-gray-900">{distributionLists.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search aliases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('alias')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  typeFilter === 'alias'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Aliases
              </button>
              <button
                onClick={() => setTypeFilter('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  typeFilter === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Lists
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {filteredAliases.map((alias) => (
            <Card key={alias.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      alias.is_distribution_list
                        ? 'bg-purple-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    {alias.is_distribution_list ? (
                      <Users className="w-6 h-6 text-purple-600" />
                    ) : (
                      <Mail className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alias.alias_address}
                      </h3>
                      <Badge
                        variant={
                          alias.is_distribution_list ? 'info' : 'success'
                        }
                      >
                        {alias.is_distribution_list
                          ? 'Distribution List'
                          : 'Alias'}
                      </Badge>
                      <Badge variant={alias.active ? 'success' : 'danger'}>
                        {alias.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {alias.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {alias.description}
                      </p>
                    )}

                    <div className="flex items-start gap-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {alias.target_addresses.map((addr, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-sm text-gray-700 rounded"
                          >
                            {addr}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Created {new Date(alias.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(alias)}
                    className={`p-2 rounded-lg transition-colors ${
                      alias.active
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={alias.active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(alias)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAlias(alias)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {filteredAliases.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {aliases.length === 0 ? 'No Aliases Created' : 'No Aliases Found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {aliases.length === 0
                    ? 'Create email aliases for forwarding or distribution'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {aliases.length === 0 && (
                  <Button onClick={openCreateModal} variant="primary">
                    Create First Alias
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedAlias ? 'Edit Alias' : 'Create Alias'}
        >
          <form onSubmit={selectedAlias ? handleUpdateAlias : handleCreateAlias}>
            <div className="space-y-4">
              <Input
                label="Alias Address"
                value={formData.alias_address}
                onChange={(e) => setFormData({ ...formData, alias_address: e.target.value })}
                required
                placeholder="alias@yourdomain.com"
                disabled={!!selectedAlias}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Addresses
                </label>
                <textarea
                  value={formData.target_addresses}
                  onChange={(e) => setFormData({ ...formData, target_addresses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="user1@domain.com, user2@domain.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple addresses with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Describe this alias..."
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_distribution_list}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_distribution_list: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Distribution List
                  </span>
                  <p className="text-xs text-gray-500">
                    Email sent to this address will be delivered to all targets
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  {selectedAlias ? 'Update Alias' : 'Create Alias'}
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
