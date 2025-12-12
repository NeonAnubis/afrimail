import React, { useState } from 'react';
import { UserX, UserCheck, Trash2, HardDrive, X, Tag } from 'lucide-react';
import { Button } from './ui/Button';
import { ApiClient } from '../lib/api';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedUserIds: string[];
  selectedEmails?: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
  onShowGroups: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  selectedUserIds,
  onActionComplete,
  onClearSelection,
  onShowGroups,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaValue, setQuotaValue] = useState('5');

  const handleBulkSuspend = async () => {
    if (!confirm(`Suspend ${selectedCount} user(s)?`)) return;

    setIsLoading(true);
    try {
      await ApiClient.post('/admin/users/bulk/suspend', { user_ids: selectedUserIds });
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk suspend failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUnsuspend = async () => {
    if (!confirm(`Unsuspend ${selectedCount} user(s)?`)) return;

    setIsLoading(true);
    try {
      await ApiClient.post('/admin/users/bulk/unsuspend', { user_ids: selectedUserIds });
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk unsuspend failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`PERMANENTLY DELETE ${selectedCount} user(s)? This action cannot be undone!`)) return;

    setIsLoading(true);
    try {
      await ApiClient.post('/admin/users/bulk/delete', { user_ids: selectedUserIds });
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkQuotaUpdate = async () => {
    const quotaBytes = parseFloat(quotaValue) * 1024 * 1024 * 1024;

    setIsLoading(true);
    try {
      await ApiClient.post('/admin/users/bulk/quota', {
        user_ids: selectedUserIds,
        quota_bytes: quotaBytes,
      });
      setShowQuotaModal(false);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk quota update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{selectedCount}</span>
            <span className="text-gray-300">selected</span>
          </div>

          <div className="h-8 w-px bg-gray-700" />

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkSuspend}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <UserX className="w-4 h-4 mr-1" />
              Suspend
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkUnsuspend}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Unsuspend
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowQuotaModal(true)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <HardDrive className="w-4 h-4 mr-1" />
              Set Quota
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onShowGroups}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Tag className="w-4 h-4 mr-1" />
              Add to Group
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-700" />

          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showQuotaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Storage Quota</h3>
            <p className="text-gray-600 mb-4">
              Set storage quota for {selectedCount} selected user(s)
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quota (GB)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                step="0.5"
                value={quotaValue}
                onChange={(e) => setQuotaValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleBulkQuotaUpdate}
                disabled={isLoading}
                className="flex-1"
              >
                Apply to {selectedCount} user(s)
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQuotaModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
