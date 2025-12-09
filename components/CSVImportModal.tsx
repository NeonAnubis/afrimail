'use client';

import React, { useState } from 'react';
import { FileUp, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ApiClient } from '@/lib/api';
import { ImportResult } from '@/types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvFile, setCSVFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCSVFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });

    return rows;
  };

  const handleImport = async () => {
    if (!csvFile) return;

    setIsProcessing(true);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);

      const result = await ApiClient.post<ImportResult>('/admin/import/csv', {
        filename: csvFile.name,
        rows,
      });

      setImportResult(result);

      if (result.successful > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setImportResult({
        total: 0,
        successful: 0,
        failed: 1,
        errors: [{ email: 'N/A', error: errorMessage }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `email,name,password,quota_bytes
john.doe@example.com,John Doe,password123,5368709120
jane.smith@example.com,Jane Smith,password123,10737418240`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setCSVFile(null);
    setImportResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="CSV User Import">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">CSV Format Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Required columns: email, name</li>
                <li>• Optional columns: password, quota_bytes</li>
                <li>• Default password: changeme123 (if not provided)</li>
                <li>• quota_bytes must be in bytes (e.g., 5368709120 for 5GB)</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        {!importResult && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      {csvFile ? (
                        <span className="font-semibold">{csvFile.name}</span>
                      ) : (
                        <>
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">CSV file only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!csvFile || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Importing...' : 'Import Users'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {importResult.total}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-6 h-6" />
                  {importResult.successful}
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                  <XCircle className="w-6 h-6" />
                  {importResult.failed}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800">
                      <span className="font-medium">{error.email}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="primary" onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
