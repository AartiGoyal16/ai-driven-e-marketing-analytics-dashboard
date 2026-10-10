'use client';

import React from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: any[];
  metrics: any[];
}

export default function ExportModal({ isOpen, onClose, campaigns, metrics }: ExportModalProps) {
  if (!isOpen) return null;

  const downloadCSV = () => {
    const headers = ['Campaign ID', 'Name', 'Platform', 'Budget', 'Status', 'Created Date'];
    const rows = campaigns.map((c) => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.platform,
      c.budget,
      c.status,
      c.created_at || 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketing_campaigns_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ campaigns, metrics }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `marketing_analytics_data_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📥</span> Export Analytics Report
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white transition">
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Export your campaign database, performance metrics, and prediction forecasts into industry-standard reporting formats.
        </p>

        <div className="space-y-3">
          <button
            onClick={downloadCSV}
            className="w-full flex items-center justify-between p-3.5 bg-gray-950 hover:bg-gray-800/80 border border-gray-800 rounded-xl text-left transition group"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition">📊 Export as CSV (.csv)</p>
              <p className="text-[11px] text-gray-400">Comma-separated campaign records for Excel & Sheets</p>
            </div>
            <span className="text-xs text-blue-400">Download →</span>
          </button>

          <button
            onClick={downloadJSON}
            className="w-full flex items-center justify-between p-3.5 bg-gray-950 hover:bg-gray-800/80 border border-gray-800 rounded-xl text-left transition group"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-400 transition">📦 Export as JSON (.json)</p>
              <p className="text-[11px] text-gray-400">Full structured object tree with campaigns and daily metrics</p>
            </div>
            <span className="text-xs text-purple-400">Download →</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="w-full flex items-center justify-between p-3.5 bg-gray-950 hover:bg-gray-800/80 border border-gray-800 rounded-xl text-left transition group"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">📄 Print / Save as PDF</p>
              <p className="text-[11px] text-gray-400">Opens browser print dialog configured for high-res PDF generation</p>
            </div>
            <span className="text-xs text-emerald-400">Print →</span>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
