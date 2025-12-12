import React, { useEffect, useState } from 'react';
import { Globe, Plus, Star, Power, Mail, Copy, CheckCircle, Info, ExternalLink, Key, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { ApiClient } from '../../lib/api';
import { AdminLayout } from '../../components/layouts/AdminLayout';

interface Domain {
  id: string;
  domain: string;
  is_primary: boolean;
  is_active: boolean;
  description: string | null;
  aliases: number;
  mailboxes: number;
  created_at: string;
}

interface DkimInfo {
  dkim_txt?: string;
  dkim_selector?: string;
  length?: number;
  privkey?: string;
  pubkey?: string;
}

export const Domains: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDnsHelpOpen, setIsDnsHelpOpen] = useState(false);
  const [isDkimModalOpen, setIsDkimModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedText, setCopiedText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [dkimInfo, setDkimInfo] = useState<DkimInfo | null>(null);
  const [isLoadingDkim, setIsLoadingDkim] = useState(false);
  const [isGeneratingDkim, setIsGeneratingDkim] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const data = await ApiClient.get<Domain[]>('/admin/domains');
      setDomains(data);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domain) {
      setDomainError('Domain is required');
      return false;
    }
    if (!domainRegex.test(domain)) {
      setDomainError('Please enter a valid domain (e.g., example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDomain(newDomain)) {
      return;
    }

    try {
      await ApiClient.post('/admin/domains/add', { domain: newDomain });
      setToast({ message: 'Domain added successfully', type: 'success' });
      setNewDomain('');
      setDomainError('');
      setIsModalOpen(false);
      fetchDomains();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to add domain', type: 'error' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleViewDkim = async (domain: string) => {
    setSelectedDomain(domain);
    setDkimInfo(null);
    setIsDkimModalOpen(true);
    setIsLoadingDkim(true);
    try {
      const data = await ApiClient.get<{ dkim: DkimInfo }>(`/admin/mailcow/dkim/${domain}`);
      setDkimInfo(data.dkim);
    } catch (error: any) {
      // DKIM might not exist yet, which is okay
      console.log('DKIM not found or error:', error.message);
    } finally {
      setIsLoadingDkim(false);
    }
  };

  const handleGenerateDkim = async () => {
    setIsGeneratingDkim(true);
    try {
      await ApiClient.post(`/admin/mailcow/dkim/${selectedDomain}`, {});
      setToast({ message: `DKIM key generated for ${selectedDomain}`, type: 'success' });
      // Refresh the DKIM info
      const data = await ApiClient.get<{ dkim: DkimInfo }>(`/admin/mailcow/dkim/${selectedDomain}`);
      setDkimInfo(data.dkim);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to generate DKIM', type: 'error' });
    } finally {
      setIsGeneratingDkim(false);
    }
  };

  const stats = {
    total: domains.length,
    active: domains.filter((d) => d.is_active).length,
    mailboxes: domains.reduce((sum, d) => sum + (d.mailboxes || 0), 0),
    aliases: domains.reduce((sum, d) => sum + (d.aliases || 0), 0),
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[{ label: 'Domain Management' }]} />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Management</h1>
            <p className="text-gray-600">Manage mail domains and DNS configuration</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDnsHelpOpen(true)}>
              <Info className="w-4 h-4 mr-2" />
              DNS Setup
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Domains"
            value={stats.total}
            icon={Globe}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Active Domains"
            value={stats.active}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Total Mailboxes"
            value={stats.mailboxes}
            icon={Mail}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Email Aliases"
            value={stats.aliases}
            icon={Copy}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid gap-6">
            {domains.map((domain) => (
              <Card key={domain.id}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${domain.is_primary ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      <Globe className={`w-8 h-8 ${domain.is_primary ? 'text-amber-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {domain.domain}
                        </h3>
                        {domain.is_primary && (
                          <Badge variant="warning">
                            <Star className="w-3 h-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                        <Badge variant={domain.is_active ? 'success' : 'danger'}>
                          <Power className="w-3 h-3 mr-1" />
                          {domain.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {domain.description && (
                        <p className="text-sm text-gray-600 mb-4">{domain.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-6 text-sm mb-4">
                        <div>
                          <p className="text-gray-600 mb-1">Mailboxes</p>
                          <p className="text-2xl font-bold text-gray-900">{domain.mailboxes || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Email Aliases</p>
                          <p className="text-2xl font-bold text-gray-900">{domain.aliases || 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewDkim(domain.domain)}
                        >
                          <Key className="w-4 h-4 mr-1" />
                          DKIM
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {domains.length === 0 && (
              <Card>
                <p className="text-center text-gray-600 py-8">No domains configured</p>
              </Card>
            )}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setDomainError('');
            setNewDomain('');
          }}
          title="Add New Domain"
        >
          <form onSubmit={handleAddDomain} className="space-y-4">
            <div>
              <Input
                type="text"
                label="Domain Name"
                placeholder="example.com"
                icon={<Globe className="w-5 h-5" />}
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value);
                  if (domainError) validateDomain(e.target.value);
                }}
                required
              />
              {domainError && <p className="mt-1 text-sm text-red-600">{domainError}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                After adding a domain, you'll need to configure DNS records. Click "DNS Setup" for detailed instructions.
              </p>
            </div>

            <Button type="submit" fullWidth>
              Add Domain
            </Button>
          </form>
        </Modal>

        <Modal
          isOpen={isDnsHelpOpen}
          onClose={() => setIsDnsHelpOpen(false)}
          title="DNS Configuration Guide"
        >
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                To use a custom domain with your mail server, you need to add the following DNS records at your domain registrar:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">MX Record</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('mail.yourdomain.com', 'MX')}
                  >
                    {copiedText === 'MX' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">Priority: 10</p>
                <code className="text-sm bg-white px-3 py-2 rounded border block">
                  mail.yourdomain.com
                </code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">SPF Record (TXT)</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('v=spf1 mx ~all', 'SPF')}
                  >
                    {copiedText === 'SPF' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border block">
                  v=spf1 mx ~all
                </code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">DKIM Record (TXT)</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('dkim._domainkey.yourdomain.com', 'DKIM')}
                  >
                    {copiedText === 'DKIM' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Contact your administrator for the DKIM public key
                </p>
                <code className="text-sm bg-white px-3 py-2 rounded border block truncate">
                  dkim._domainkey.yourdomain.com
                </code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">DMARC Record (TXT)</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com', 'DMARC')}
                  >
                    {copiedText === 'DMARC' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border block text-xs">
                  v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
                </code>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>DNS changes can take 24-48 hours to propagate</li>
                    <li>Replace "yourdomain.com" with your actual domain</li>
                    <li>Verify records are correct before sending production emails</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => window.open('https://mxtoolbox.com/', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Test DNS Configuration
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={isDkimModalOpen}
          onClose={() => {
            setIsDkimModalOpen(false);
            setDkimInfo(null);
            setSelectedDomain('');
          }}
          title={`DKIM for ${selectedDomain}`}
        >
          <div className="space-y-4">
            {isLoadingDkim ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : dkimInfo && dkimInfo.dkim_txt ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selector</label>
                  <p className="text-gray-900">{dkimInfo.dkim_selector || 'dkim'}</p>
                </div>
                {dkimInfo.length && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Length</label>
                    <p className="text-gray-900">{dkimInfo.length} bits</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNS Record Name
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded border">
                      {dkimInfo.dkim_selector || 'dkim'}._domainkey.{selectedDomain}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`${dkimInfo.dkim_selector || 'dkim'}._domainkey.${selectedDomain}`, 'DKIM_NAME')}
                    >
                      {copiedText === 'DKIM_NAME' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TXT Record Value
                  </label>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={dkimInfo.dkim_txt}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                      rows={6}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(dkimInfo.dkim_txt || '', 'DKIM_TXT')}
                    >
                      {copiedText === 'DKIM_TXT' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Add this TXT record to your DNS provider to enable DKIM signing for emails sent from {selectedDomain}.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No DKIM key found for this domain.</p>
                <Button onClick={handleGenerateDkim} disabled={isGeneratingDkim}>
                  {isGeneratingDkim ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Generate DKIM Key
                    </>
                  )}
                </Button>
              </div>
            )}

            {dkimInfo && dkimInfo.dkim_txt && (
              <Button
                variant="outline"
                fullWidth
                onClick={handleGenerateDkim}
                disabled={isGeneratingDkim}
              >
                {isGeneratingDkim ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate DKIM Key
                  </>
                )}
              </Button>
            )}
          </div>
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
};
