import React, { useEffect, useState } from 'react';
import { Mail, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { ApiClient } from '../../lib/api';
import { EmailAlias } from '../../types';
import { AdminLayout } from '../../components/layouts/AdminLayout';

export const Aliases: React.FC = () => {
  const [aliases, setAliases] = useState<EmailAlias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDistributionList, setIsDistributionList] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    alias_address: '',
    target_addresses: '',
    description: '',
  });

  useEffect(() => {
    fetchAliases();
  }, []);

  const fetchAliases = async () => {
    try {
      const data = await ApiClient.get<EmailAlias[]>('/admin/aliases');
      setAliases(data);
    } catch (error) {
      console.error('Failed to fetch aliases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetArray = formData.target_addresses
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (targetArray.length === 0) {
      setToast({ message: 'Please enter at least one target address', type: 'error' });
      return;
    }

    try {
      await ApiClient.post('/admin/aliases', {
        alias_address: formData.alias_address,
        target_addresses: targetArray,
        is_distribution_list: isDistributionList,
        description: formData.description,
      });
      setToast({ message: 'Alias created successfully', type: 'success' });
      setIsModalOpen(false);
      setFormData({ alias_address: '', target_addresses: '', description: '' });
      setIsDistributionList(false);
      fetchAliases();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to create alias', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alias?')) return;

    try {
      await ApiClient.delete(`/admin/aliases/${id}`);
      setToast({ message: 'Alias deleted successfully', type: 'success' });
      fetchAliases();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete alias', type: 'error' });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await ApiClient.put(`/admin/aliases/${id}/toggle`, { active: !currentStatus });
      setToast({
        message: `Alias ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
      });
      fetchAliases();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update alias', type: 'error' });
    }
  };

  const regularAliases = aliases.filter((a) => !a.is_distribution_list);
  const distributionLists = aliases.filter((a) => a.is_distribution_list);

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Aliases & Distribution Lists</h1>
            <p className="text-gray-600">Manage email aliases and group addresses</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Alias
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Aliases</p>
                <p className="text-3xl font-bold text-gray-900">{regularAliases.length}</p>
              </div>
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Distribution Lists</p>
                <p className="text-3xl font-bold text-gray-900">{distributionLists.length}</p>
              </div>
              <UsersIcon className="w-10 h-10 text-green-600" />
            </div>
          </Card>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Email Aliases</h2>
              {regularAliases.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-600 py-8">No aliases configured</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {regularAliases.map((alias) => (
                    <Card key={alias.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <Mail className="w-6 h-6 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {alias.alias_address}
                              </h3>
                              <Badge variant={alias.active ? 'success' : 'danger'}>
                                {alias.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            {alias.description && (
                              <p className="text-sm text-gray-600 mb-2">{alias.description}</p>
                            )}
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Forwards to:</span>{' '}
                              {alias.target_addresses.join(', ')}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {new Date(alias.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleActive(alias.id, alias.active)}
                          >
                            {alias.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDelete(alias.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Distribution Lists</h2>
              {distributionLists.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-600 py-8">No distribution lists configured</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {distributionLists.map((list) => (
                    <Card key={list.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <UsersIcon className="w-6 h-6 text-green-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {list.alias_address}
                              </h3>
                              <Badge variant={list.active ? 'success' : 'danger'}>
                                {list.active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="info">{list.target_addresses.length} members</Badge>
                            </div>
                            {list.description && (
                              <p className="text-sm text-gray-600 mb-2">{list.description}</p>
                            )}
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Members:</span>{' '}
                              {list.target_addresses.join(', ')}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {new Date(list.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleActive(list.id, list.active)}
                          >
                            {list.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDelete(list.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setFormData({ alias_address: '', target_addresses: '', description: '' });
            setIsDistributionList(false);
          }}
          title="Create New Alias"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_distribution"
                checked={isDistributionList}
                onChange={(e) => setIsDistributionList(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="is_distribution" className="text-sm text-gray-700">
                This is a distribution list (group email)
              </label>
            </div>

            <Input
              type="email"
              label="Alias Address"
              placeholder="alias@example.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.alias_address}
              onChange={(e) => setFormData({ ...formData, alias_address: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Addresses
              </label>
              <textarea
                placeholder="user1@example.com, user2@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={formData.target_addresses}
                onChange={(e) => setFormData({ ...formData, target_addresses: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple addresses with commas
              </p>
            </div>

            <Input
              type="text"
              label="Description (Optional)"
              placeholder="Brief description of this alias"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Button type="submit" fullWidth>
              Create {isDistributionList ? 'Distribution List' : 'Alias'}
            </Button>
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
};
