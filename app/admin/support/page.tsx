'use client';

import React, { useEffect, useState } from 'react';
import { Ticket, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ApiClient } from '@/lib/api';
import { SupportTicket } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await ApiClient.get<SupportTicket[]>('/admin/support/tickets');
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets =
    filter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === filter);

  const handleResolve = async (ticketId: string) => {
    try {
      await ApiClient.put(`/admin/support/tickets/${ticketId}/resolve`, {
        resolution_notes: resolutionNotes,
      });
      setToast({ message: 'Ticket resolved successfully', type: 'success' });
      setIsModalOpen(false);
      setResolutionNotes('');
      fetchTickets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve ticket';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleReject = async (ticketId: string) => {
    try {
      await ApiClient.put(`/admin/support/tickets/${ticketId}/reject`, {
        resolution_notes: resolutionNotes,
      });
      setToast({ message: 'Ticket rejected successfully', type: 'success' });
      setIsModalOpen(false);
      setResolutionNotes('');
      fetchTickets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject ticket';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleUnlock = async (email: string) => {
    try {
      await ApiClient.put(`/admin/users/${email}/unlock`, {});
      setToast({ message: 'Account unlocked successfully', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlock account';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'password_reset':
        return <AlertCircle className="w-5 h-5" />;
      case 'account_unlock':
        return <XCircle className="w-5 h-5" />;
      case 'quota_increase':
        return <Clock className="w-5 h-5" />;
      default:
        return <Ticket className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Recovery Center</h1>
        <p className="text-gray-600 mb-8">Manage user support requests and account recovery</p>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{inProgressCount}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-gray-900">{resolvedCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex gap-2 mb-4">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              All ({tickets.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'primary' : 'secondary'}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === 'in_progress' ? 'primary' : 'secondary'}
              onClick={() => setFilter('in_progress')}
            >
              In Progress ({inProgressCount})
            </Button>
            <Button
              variant={filter === 'resolved' ? 'primary' : 'secondary'}
              onClick={() => setFilter('resolved')}
            >
              Resolved ({resolvedCount})
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      {getTypeIcon(ticket.ticket_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.ticket_type.replace('_', ' ').toUpperCase()}
                        </h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">User:</span> {ticket.user_email}
                      </p>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: {new Date(ticket.created_at).toLocaleString()}
                      </p>
                      {ticket.resolved_at && (
                        <p className="text-xs text-gray-500">
                          Resolved: {new Date(ticket.resolved_at).toLocaleString()}
                        </p>
                      )}
                      {ticket.resolution_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">Resolution:</span> {ticket.resolution_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {ticket.status === 'pending' && (
                    <div className="flex gap-2">
                      {ticket.ticket_type === 'account_unlock' && (
                        <Button size="sm" onClick={() => handleUnlock(ticket.user_email)}>
                          Unlock Now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsModalOpen(true);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {filteredTickets.length === 0 && (
              <Card>
                <p className="text-center text-gray-600 py-8">No tickets found</p>
              </Card>
            )}
          </div>
        )}

        {selectedTicket && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setResolutionNotes('');
            }}
            title="Review Support Ticket"
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Ticket Type</p>
                <p className="font-semibold text-gray-900">
                  {selectedTicket.ticket_type.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User</p>
                <p className="font-semibold text-gray-900">{selectedTicket.user_email}</p>
              </div>
              {selectedTicket.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{selectedTicket.description}</p>
                </div>
              )}

              <Input
                type="text"
                label="Resolution Notes"
                placeholder="Enter resolution notes..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />

              <div className="flex gap-2">
                <Button fullWidth onClick={() => handleResolve(selectedTicket.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => handleReject(selectedTicket.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {toast && (
          <ToastContainer>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </ToastContainer>
        )}
      </div>
    </AdminLayout>
  );
}
