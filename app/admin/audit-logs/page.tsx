'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { ApiClient } from '@/lib/api';
import { formatDate, formatActionType } from '@/lib/utils';
import { AuditLog } from '@/types';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await ApiClient.get<AuditLog[]>('/admin/audit-logs');
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string): 'success' | 'warning' | 'danger' | 'default' => {
    if (action.includes('create') || action.includes('add')) return 'success';
    if (action.includes('suspend') || action.includes('delete')) return 'danger';
    if (action.includes('update') || action.includes('edit')) return 'warning';
    return 'default';
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (log) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDate(log.timestamp)}</div>
          <div className="text-gray-500">
            {new Date(log.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
      width: '180px',
    },
    {
      key: 'action_type',
      label: 'Action',
      sortable: true,
      render: (log) => (
        <Badge variant={getActionBadgeVariant(log.action_type)}>
          {formatActionType(log.action_type)}
        </Badge>
      ),
      width: '200px',
    },
    {
      key: 'admin_email',
      label: 'Admin',
      sortable: true,
      render: (log) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{log.admin_email.split('@')[0]}</div>
          <div className="text-gray-500">{log.admin_email}</div>
        </div>
      ),
    },
    {
      key: 'target_user_email',
      label: 'Target User',
      sortable: true,
      render: (log) => (
        <span className="text-sm text-gray-700">{log.target_user_email || '—'}</span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (log) => (
        <span className="text-sm text-gray-600">
          {log.details
            ? typeof log.details === 'string'
              ? log.details
              : JSON.stringify(log.details).substring(0, 50)
            : '—'}
        </span>
      ),
    },
  ];

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
        <Breadcrumb items={[{ label: 'Audit Logs' }]} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
            <p className="text-gray-600">Complete record of all administrative actions</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-5 h-5" />
            <span>{logs.length} total entries</span>
          </div>
        </div>

        <Card>
          <DataTable
            data={logs}
            columns={columns}
            searchable
            searchPlaceholder="Search by admin, action, or target user..."
            searchKeys={['admin_email', 'action_type', 'target_user_email']}
            emptyIcon={FileText}
            emptyTitle="No audit logs found"
            emptyDescription="Administrative actions will appear here"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
