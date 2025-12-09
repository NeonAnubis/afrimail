'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { Announcement } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_group: 'all',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    expires_at: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await ApiClient.get<Announcement[]>('/admin/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await ApiClient.post('/admin/announcements', formData);
      setToast({ message: 'Announcement created successfully', type: 'success' });
      setIsModalOpen(false);
      setFormData({
        title: '',
        message: '',
        target_group: 'all',
        priority: 'normal',
        expires_at: '',
      });
      fetchAnnouncements();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create announcement';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await ApiClient.put(`/admin/announcements/${id}/publish`, {});
      setToast({ message: 'Announcement published successfully', type: 'success' });
      fetchAnnouncements();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish announcement';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await ApiClient.delete(`/admin/announcements/${id}`);
      setToast({ message: 'Announcement deleted successfully', type: 'success' });
      fetchAnnouncements();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete announcement';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'normal':
        return <Badge variant="info">Normal</Badge>;
      case 'low':
        return <Badge variant="success">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const publishedCount = announcements.filter((a) => a.published).length;
  const draftCount = announcements.filter((a) => !a.published).length;

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Announcements & Communications
            </h1>
            <p className="text-gray-600">Send notifications and updates to users</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{announcements.length}</p>
              </div>
              <Megaphone className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published</p>
                <p className="text-3xl font-bold text-gray-900">{publishedCount}</p>
              </div>
              <Send className="w-10 h-10 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Drafts</p>
                <p className="text-3xl font-bold text-gray-900">{draftCount}</p>
              </div>
              <Megaphone className="w-10 h-10 text-orange-600" />
            </div>
          </Card>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <Megaphone
                      className={`w-6 h-6 mt-1 ${
                        announcement.published ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                        {getPriorityBadge(announcement.priority)}
                        <Badge variant={announcement.published ? 'success' : 'warning'}>
                          {announcement.published ? 'Published' : 'Draft'}
                        </Badge>
                        {announcement.target_group !== 'all' && (
                          <Badge variant="info">Target: {announcement.target_group}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{announcement.message}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                          Created: {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                        {announcement.published_at && (
                          <span>
                            Published: {new Date(announcement.published_at).toLocaleDateString()}
                          </span>
                        )}
                        {announcement.expires_at && (
                          <span>
                            Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!announcement.published && (
                      <Button size="sm" onClick={() => handlePublish(announcement.id)}>
                        <Send className="w-4 h-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {announcements.length === 0 && (
              <Card>
                <p className="text-center text-gray-600 py-8">No announcements created</p>
              </Card>
            )}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setFormData({
              title: '',
              message: '',
              target_group: 'all',
              priority: 'normal',
              expires_at: '',
            });
          }}
          title="Create New Announcement"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              type="text"
              label="Title"
              placeholder="Announcement title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                placeholder="Enter your announcement message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent',
                  })
                }
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Group</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.target_group}
                onChange={(e) => setFormData({ ...formData, target_group: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="active">Active Users Only</option>
                <option value="suspended">Suspended Users Only</option>
              </select>
            </div>

            <Input
              type="datetime-local"
              label="Expiration Date (Optional)"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            />

            <Button type="submit" fullWidth>
              Create Announcement
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
}
