'use client';

import React, { useState, useEffect } from 'react';

export interface CampaignData {
  id?: string;
  name: string;
  platform: string;
  budget: number | string;
  status: string;
}

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignData) => void;
  initialData?: CampaignData | null;
  title?: string;
  loading?: boolean;
}

export default function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Create Campaign',
  loading = false,
}: CampaignModalProps) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Google');
  const [budget, setBudget] = useState('1000');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState<{ name?: string; budget?: string }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPlatform(initialData.platform || 'Google');
      setBudget(initialData.budget?.toString() || '1000');
      setStatus(initialData.status || 'active');
    } else {
      setName('');
      setPlatform('Google');
      setBudget('1000');
      setStatus('active');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { name?: string; budget?: string } = {};
    if (!name.trim()) errs.name = 'Campaign name is required.';
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      errs.budget = 'Please enter a valid positive budget amount.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      platform,
      budget: parseFloat(budget),
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Black Friday Awareness"
              className={`w-full px-4 py-3 bg-gray-950 border ${
                errors.name ? 'border-red-500' : 'border-gray-800'
              } rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="Google">Google Ads</option>
                <option value="Meta">Meta / Facebook</option>
                <option value="LinkedIn">LinkedIn Ads</option>
                <option value="TikTok">TikTok Ads</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Budget ($ USD)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-950 border ${
                  errors.budget ? 'border-red-500' : 'border-gray-800'
                } rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
              />
              {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Campaign Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:bg-blue-800 rounded-xl shadow-lg transition duration-150"
            >
              {loading ? 'Saving...' : initialData ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
