import React, { useEffect, useState } from 'react';
import {
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  HardDrive,
  Shield,
  FileText,
  Inbox,
  Activity,
  Power,
  Key,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { ApiClient } from '../../lib/api';
import { formatBytes, formatDate } from '../../lib/utils';
import { AdminLayout } from '../../components/layouts/AdminLayout';

interface HealthStatus {
  status: string;
  api_url?: string;
  connected?: boolean;
  message?: string;
}

interface Mailbox {
  email: string;
  username: string;
  domain: string;
  name: string;
  quota_bytes: number;
  quota_used_bytes: number;
  quota_percentage: number;
  messages: number;
  active: boolean;
  last_imap_login: string | null;
  last_smtp_login: string | null;
  created: string;
  modified: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  total_mailboxes: number;
  synced: number;
  created: number;
}

interface LogEntry {
  time?: string;
  message?: string;
  priority?: string;
  program?: string;
  [key: string]: any;
}

interface DkimInfo {
  dkim_txt?: string;
  dkim_selector?: string;
  length?: number;
  privkey?: string;
  pubkey?: string;
}

export const Mailcow: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'mailboxes' | 'logs' | 'dkim'>('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logType, setLogType] = useState<string>('postfix');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // DKIM state
  const [dkimDomain, setDkimDomain] = useState<string>('');
  const [dkimInfo, setDkimInfo] = useState<DkimInfo | null>(null);
  const [isLoadingDkim, setIsLoadingDkim] = useState(false);
  const [showDkimModal, setShowDkimModal] = useState(false);

  // Stats
  const [rspamdStats, setRspamdStats] = useState<any>(null);
  const [mailQueue, setMailQueue] = useState<any[]>([]);
  const [quarantine, setQuarantine] = useState<any[]>([]);

  useEffect(() => {
    fetchHealthStatus();
    fetchMailboxes();
    fetchAdditionalStats();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const data = await ApiClient.get<HealthStatus>('/admin/mailcow/health');
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      setHealth({ status: 'error', message: 'Failed to connect' });
    }
  };

  const fetchMailboxes = async () => {
    try {
      const data = await ApiClient.get<{ mailboxes: Mailbox[] }>('/admin/mailcow/mailboxes');
      setMailboxes(data.mailboxes || []);
    } catch (error) {
      console.error('Failed to fetch mailboxes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdditionalStats = async () => {
    try {
      const [rspamd, queue, quar] = await Promise.all([
        ApiClient.get<{ stats: any }>('/admin/mailcow/stats/rspamd').catch(() => ({ stats: null })),
        ApiClient.get<{ queue: any[] }>('/admin/mailcow/mail-queue').catch(() => ({ queue: [] })),
        ApiClient.get<{ quarantine: any[] }>('/admin/mailcow/quarantine').catch(() => ({ quarantine: [] })),
      ]);
      setRspamdStats(rspamd.stats);
      setMailQueue(queue.queue || []);
      setQuarantine(quar.quarantine || []);
    } catch (error) {
      console.error('Failed to fetch additional stats:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await ApiClient.post<SyncResult>('/admin/mailcow/sync/mailboxes', {});
      setToast({ message: result.message, type: 'success' });
      fetchMailboxes();
    } catch (error: any) {
      setToast({ message: error.message || 'Sync failed', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchLogs = async (type: string) => {
    setIsLoadingLogs(true);
    setLogType(type);
    try {
      const data = await ApiClient.get<{ logs: LogEntry[] }>(`/admin/mailcow/logs/${type}?count=50`);
      // Ensure logs is always an array
      const logsArray = Array.isArray(data.logs) ? data.logs : [];
      setLogs(logsArray);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch logs', type: 'error' });
      setLogs([]); // Reset to empty array on error
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchDkim = async (domain: string) => {
    if (!domain) return;
    setIsLoadingDkim(true);
    try {
      const data = await ApiClient.get<{ dkim: DkimInfo }>(`/admin/mailcow/dkim/${domain}`);
      setDkimInfo(data.dkim);
      setShowDkimModal(true);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch DKIM', type: 'error' });
    } finally {
      setIsLoadingDkim(false);
    }
  };

  const handleGenerateDkim = async (domain: string) => {
    try {
      await ApiClient.post(`/admin/mailcow/dkim/${domain}`, {});
      setToast({ message: `DKIM generated for ${domain}`, type: 'success' });
      fetchDkim(domain);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to generate DKIM', type: 'error' });
    }
  };

  const handleToggleMailbox = async (email: string, currentActive: boolean) => {
    try {
      const endpoint = currentActive
        ? `/admin/mailcow/mailboxes/${email}/deactivate`
        : `/admin/mailcow/mailboxes/${email}/activate`;
      await ApiClient.post(endpoint, {});
      setToast({
        message: `Mailbox ${currentActive ? 'deactivated' : 'activated'} successfully`,
        type: 'success',
      });
      fetchMailboxes();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update mailbox', type: 'error' });
    }
  };

  const getHealthStatusIcon = () => {
    if (!health) return <AlertTriangle className="w-8 h-8 text-gray-400" />;
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'unhealthy':
        return <XCircle className="w-8 h-8 text-red-600" />;
      case 'not_configured':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      default:
        return <XCircle className="w-8 h-8 text-red-600" />;
    }
  };

  const getHealthStatusBadge = () => {
    if (!health) return <Badge variant="default">Unknown</Badge>;
    switch (health.status) {
      case 'healthy':
        return <Badge variant="success">Connected</Badge>;
      case 'unhealthy':
        return <Badge variant="danger">Disconnected</Badge>;
      case 'not_configured':
        return <Badge variant="warning">Not Configured</Badge>;
      default:
        return <Badge variant="danger">Error</Badge>;
    }
  };

  const stats = {
    totalMailboxes: mailboxes.length,
    activeMailboxes: mailboxes.filter((m) => m.active).length,
    totalStorage: mailboxes.reduce((sum, m) => sum + m.quota_bytes, 0),
    usedStorage: mailboxes.reduce((sum, m) => sum + m.quota_used_bytes, 0),
  };

  const logTypes = [
    { value: 'postfix', label: 'Postfix' },
    { value: 'dovecot', label: 'Dovecot' },
    { value: 'rspamd-history', label: 'Rspamd' },
    { value: 'sogo', label: 'SOGo' },
    { value: 'api', label: 'API' },
    { value: 'acme', label: 'ACME' },
    { value: 'netfilter', label: 'Netfilter' },
  ];

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[{ label: 'Mail Server Management' }]} />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mail Server (Mailcow)</h1>
            <p className="text-gray-600">Manage and monitor your Mailcow mail server</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchHealthStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={handleSync} disabled={isSyncing || health?.status !== 'healthy'}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Mailboxes'}
            </Button>
          </div>
        </div>

        {/* Health Status Card */}
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">{getHealthStatusIcon()}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mailcow Server Status</h3>
                <p className="text-sm text-gray-600">
                  {health?.api_url || 'API URL not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getHealthStatusBadge()}
              {health?.message && (
                <span className="text-sm text-gray-600">{health.message}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Mailboxes"
            value={stats.totalMailboxes}
            icon={Mail}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Active Mailboxes"
            value={stats.activeMailboxes}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Total Storage"
            value={formatBytes(stats.totalStorage)}
            icon={HardDrive}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Used Storage"
            value={formatBytes(stats.usedStorage)}
            icon={Activity}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Server },
              { id: 'mailboxes', label: 'Mailboxes', icon: Mail },
              { id: 'logs', label: 'Logs', icon: FileText },
              { id: 'dkim', label: 'DKIM', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mail Queue */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Inbox className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Mail Queue</h3>
              </div>
              {mailQueue.length > 0 ? (
                <div className="space-y-2">
                  {mailQueue.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">{item.sender || 'Unknown sender'}</p>
                      <p className="text-gray-600">{item.recipients || 'Unknown recipient'}</p>
                    </div>
                  ))}
                  {mailQueue.length > 5 && (
                    <p className="text-sm text-gray-500">+{mailQueue.length - 5} more items</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">Mail queue is empty</p>
              )}
            </Card>

            {/* Quarantine */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Quarantine</h3>
              </div>
              {quarantine.length > 0 ? (
                <div className="space-y-2">
                  {quarantine.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">{item.sender || 'Unknown'}</p>
                      <p className="text-gray-600">{item.subject || 'No subject'}</p>
                    </div>
                  ))}
                  {quarantine.length > 5 && (
                    <p className="text-sm text-gray-500">+{quarantine.length - 5} more items</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No quarantined messages</p>
              )}
            </Card>

            {/* Rspamd Stats */}
            {rspamdStats && (
              <Card className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Spam Filter Statistics (Rspamd)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Clean</p>
                    <p className="text-2xl font-bold text-green-600">{rspamdStats.clean || 0}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Probable Spam</p>
                    <p className="text-2xl font-bold text-yellow-600">{rspamdStats.probable || 0}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Spam</p>
                    <p className="text-2xl font-bold text-red-600">{rspamdStats.spam || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Scanned</p>
                    <p className="text-2xl font-bold text-gray-900">{rspamdStats.scanned || 0}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'mailboxes' && (
          <div>
            {isLoading ? (
              <Loading />
            ) : mailboxes.length === 0 ? (
              <Card>
                <p className="text-center text-gray-600 py-8">No mailboxes found in Mailcow</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {mailboxes.map((mailbox) => {
                  const usagePercent = mailbox.quota_bytes > 0
                    ? (mailbox.quota_used_bytes / mailbox.quota_bytes) * 100
                    : 0;

                  return (
                    <Card key={mailbox.email}>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${mailbox.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Mail className={`w-6 h-6 ${mailbox.active ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{mailbox.email}</h3>
                              <Badge variant={mailbox.active ? 'success' : 'danger'}>
                                {mailbox.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            {mailbox.name && (
                              <p className="text-sm text-gray-600 mb-2">{mailbox.name}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">Messages:</span>{' '}
                                <span className="font-medium">{mailbox.messages}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Domain:</span>{' '}
                                <span className="font-medium">{mailbox.domain}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Last IMAP:</span>{' '}
                                <span className="font-medium">
                                  {mailbox.last_imap_login ? formatDate(mailbox.last_imap_login) : 'Never'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Last SMTP:</span>{' '}
                                <span className="font-medium">
                                  {mailbox.last_smtp_login ? formatDate(mailbox.last_smtp_login) : 'Never'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Storage</span>
                                <span className="font-medium">
                                  {formatBytes(mailbox.quota_used_bytes)} / {formatBytes(mailbox.quota_bytes)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
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
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleMailbox(mailbox.email, mailbox.active)}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {logTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={logType === type.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => fetchLogs(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {isLoadingLogs ? (
              <Loading />
            ) : logs.length === 0 ? (
              <Card>
                <p className="text-center text-gray-600 py-8">
                  Select a log type to view logs
                </p>
              </Card>
            ) : (
              <Card>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg font-mono text-sm"
                    >
                      {log.time && (
                        <span className="text-gray-500">[{log.time}] </span>
                      )}
                      {log.program && (
                        <span className="text-blue-600">{log.program}: </span>
                      )}
                      <span className="text-gray-900">
                        {log.message || JSON.stringify(log)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'dkim' && (
          <div>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Lookup DKIM Key</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter domain (e.g., example.com)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dkimDomain}
                  onChange={(e) => setDkimDomain(e.target.value)}
                />
                <Button onClick={() => fetchDkim(dkimDomain)} disabled={!dkimDomain || isLoadingDkim}>
                  <Key className="w-4 h-4 mr-2" />
                  {isLoadingDkim ? 'Loading...' : 'Get DKIM'}
                </Button>
                <Button variant="secondary" onClick={() => handleGenerateDkim(dkimDomain)} disabled={!dkimDomain}>
                  Generate New
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">About DKIM</h3>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>
                  DKIM (DomainKeys Identified Mail) is an email authentication method that adds
                  a digital signature to outgoing messages. This signature helps receiving mail
                  servers verify that the email was sent from an authorized server and hasn't
                  been modified in transit.
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Enter a domain name to view its DKIM public key</li>
                  <li>You can generate new DKIM keys for domains managed by Mailcow</li>
                  <li>Add the DKIM TXT record to your DNS to enable email signing</li>
                </ul>
              </div>
            </Card>
          </div>
        )}

        {/* DKIM Modal */}
        <Modal isOpen={showDkimModal} onClose={() => setShowDkimModal(false)} title="DKIM Information">
          {dkimInfo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <p className="text-gray-900">{dkimDomain}</p>
              </div>
              {dkimInfo.dkim_selector && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selector</label>
                  <p className="text-gray-900">{dkimInfo.dkim_selector}</p>
                </div>
              )}
              {dkimInfo.length && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Length</label>
                  <p className="text-gray-900">{dkimInfo.length} bits</p>
                </div>
              )}
              {dkimInfo.dkim_txt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNS TXT Record Value
                  </label>
                  <textarea
                    readOnly
                    value={dkimInfo.dkim_txt}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add this as a TXT record for: {dkimInfo.dkim_selector || 'dkim'}._domainkey.{dkimDomain}
                  </p>
                </div>
              )}
              {dkimInfo.pubkey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                  <textarea
                    readOnly
                    value={dkimInfo.pubkey}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                    rows={4}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No DKIM information available for this domain.</p>
          )}
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
