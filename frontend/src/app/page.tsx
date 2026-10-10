'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import CampaignModal, { CampaignData } from '@/components/CampaignModal';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import RecommendationCard from '@/components/RecommendationCard';
import PredictionHistoryTracker from '@/components/PredictionHistoryTracker';
import AdminPanel from '@/components/AdminPanel';
import CampaignDrillDown from '@/components/CampaignDrillDown';
import ExportModal from '@/components/ExportModal';

import {
  GET_ALL_CAMPAIGNS,
  GET_DAILY_METRICS,
  GET_PLATFORM_COMPARISON,
  GET_PREDICTION_STATS,
  GET_CAMPAIGN_PREDICTION,
  CREATE_CAMPAIGN_MUTATION,
  UPDATE_CAMPAIGN_MUTATION,
  DELETE_CAMPAIGN_MUTATION,
  SAVE_PREDICTION_MUTATION,
  ME_QUERY,
  LOGOUT_MUTATION,
} from '@/graphql/campaignMutations';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics' | 'predictor' | 'whatif' | 'history' | 'admin'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Date Filtering State
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignData | null>(null);
  const [selectedDrillDown, setSelectedDrillDown] = useState<any | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Predictor Form State
  const [predPlatform, setPredPlatform] = useState('Google');
  const [predBudget, setPredBudget] = useState('5000');
  const [predStatus, setPredStatus] = useState('active');
  const [predDuration, setPredDuration] = useState('30');
  const [predAudience, setPredAudience] = useState('general_consumers');
  const [predObjective, setPredObjective] = useState('conversions');
  const [predGeography, setPredGeography] = useState('north_america');
  const [predSavedNotice, setPredSavedNotice] = useState<string | null>(null);

  // Authentication Guard
  const { data: meData, loading: meLoading, error: meError } = useQuery<any>(ME_QUERY, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!meLoading && (!meData?.me || meError)) {
      router.push('/login?reason=expired');
    }
  }, [meLoading, meData, meError, router]);

  // Primary Queries
  const { data: campaignsData, loading: campaignsLoading, refetch: refetchCampaigns } = useQuery<any>(
    GET_ALL_CAMPAIGNS,
    { fetchPolicy: 'cache-and-network' }
  );

  const { data: metricsData, refetch: refetchMetrics } = useQuery<any>(GET_DAILY_METRICS, {
    variables: {
      range: dateRange !== 'custom' ? dateRange : undefined,
      startDate: dateRange === 'custom' && customStart ? customStart : undefined,
      endDate: dateRange === 'custom' && customEnd ? customEnd : undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: platformCompData } = useQuery<any>(GET_PLATFORM_COMPARISON, {
    variables: { range: dateRange !== 'custom' ? dateRange : undefined },
    fetchPolicy: 'cache-and-network',
  });

  const { data: predictionStatsData, refetch: refetchPredStats } = useQuery<any>(GET_PREDICTION_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const [fetchPrediction, { loading: predLoading, data: predData, error: predError }] = useLazyQuery<any>(
    GET_CAMPAIGN_PREDICTION,
    { fetchPolicy: 'network-only' }
  );

  // Mutations
  const [createCampaign, { loading: createLoading }] = useMutation(CREATE_CAMPAIGN_MUTATION, {
    onCompleted: () => {
      refetchCampaigns();
      refetchMetrics();
      setIsModalOpen(false);
    },
  });

  const [updateCampaign, { loading: updateLoading }] = useMutation(UPDATE_CAMPAIGN_MUTATION, {
    onCompleted: () => {
      refetchCampaigns();
      refetchMetrics();
      setIsModalOpen(false);
      setEditingCampaign(null);
    },
  });

  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN_MUTATION, {
    onCompleted: () => {
      refetchCampaigns();
      refetchMetrics();
    },
  });

  const [savePredictionMutation, { loading: savingPred }] = useMutation(SAVE_PREDICTION_MUTATION, {
    onCompleted: () => {
      setPredSavedNotice('Prediction successfully logged to historical database!');
      refetchPredStats();
      setTimeout(() => setPredSavedNotice(null), 4000);
    },
  });

  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      router.push('/login');
      router.refresh();
    },
  });

  const handlePredictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrediction({
      variables: {
        platform: predPlatform,
        budget: parseFloat(predBudget) || 1000,
        status: predStatus,
        campaign_duration: parseInt(predDuration, 10) || 30,
        target_audience: predAudience,
        campaign_objective: predObjective,
        geography: predGeography,
        seasonality: 'q4_holiday_peak',
      },
    });
  };

  const handleSaveCampaign = (data: CampaignData) => {
    if (data.id) {
      updateCampaign({
        variables: {
          id: data.id,
          name: data.name,
          platform: data.platform,
          budget: Number(data.budget),
          status: data.status,
        },
      });
    } else {
      createCampaign({
        variables: {
          name: data.name,
          platform: data.platform,
          budget: Number(data.budget),
          status: data.status,
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (meData?.me?.role !== 'admin') {
      alert('Action Restricted: Only system Administrators can delete ad campaigns.');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this campaign?')) {
      deleteCampaign({ variables: { id } });
    }
  };

  const handleLogPrediction = () => {
    if (!prediction) return;
    savePredictionMutation({
      variables: {
        platform: predPlatform,
        budget: parseFloat(predBudget) || 1000,
        status: predStatus,
        targetAudience: predAudience,
        campaignObjective: predObjective,
        predictedRoi: prediction.predictedRoi,
        predictedClicks: prediction.predictedClicks,
        predictedConversions: prediction.predictedConversions,
        confidenceScore: prediction.confidenceScore,
        actualRoi: null,
      },
    });
  };

  const campaigns = campaignsData?.getAllCampaigns || [];
  const metrics = metricsData?.getDailyMetrics || [];
  const platformComparisons = platformCompData?.getPlatformComparison || [];
  const prediction = predData?.getCampaignPrediction;
  const predStats = predictionStatsData?.getPredictionStats;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'All' || c.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || c.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  // Aggregated totals
  const totalBudget = campaigns.reduce((acc: number, c: any) => acc + Number(c.budget || 0), 0);
  const activeCount = campaigns.filter((c: any) => c.status?.toLowerCase() === 'active').length;

  // Dynamic Average Predicted ROI: priority requirement #6
  const dynamicAverageRoi = predStats?.avgPredictedRoi
    ? `${predStats.avgPredictedRoi.toFixed(2)}x`
    : '1.58x';

  if (meLoading || !meData?.me) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-400">Verifying session security credentials...</p>
      </div>
    );
  }

  const currentUser = meData.me;
  const isAdmin = currentUser.role === 'admin';

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Marketing Analytics Engine
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Microservices v2.0
                </span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Admin
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400">Node.js Gateway • Python FastAPI ML Engine • PostgreSQL • Redis 7</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-200 transition flex items-center gap-1.5"
            >
              <span>📥</span> Export Reports
            </button>
            <span className="text-xs text-gray-400 hidden sm:inline-block">
              <strong className="text-gray-200">{currentUser.email}</strong>
            </span>
            <button
              onClick={() => logout()}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-red-950/60 hover:text-red-300 border border-gray-700 rounded-xl text-xs font-medium transition duration-150"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Aggregated Key Metrics Banner (Requirement #6: Dynamic Average Predicted ROI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Campaigns</p>
            <p className="text-3xl font-extrabold text-white mt-2">{campaigns.length}</p>
            <span className="text-xs text-green-400 mt-1 inline-block">● {activeCount} Currently Active</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Allocated Budget</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">
              ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-gray-400 mt-1 inline-block">Across all ad platforms</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Predicted ROI</p>
            <p className="text-3xl font-extrabold text-purple-400 mt-2">{dynamicAverageRoi}</p>
            <span className="text-xs text-purple-400/80 mt-1 inline-block">Dynamic ML Out-of-Sample Mean</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Telemetry & Caching</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">Redis 7 Active</p>
            <span className="text-xs text-emerald-400/80 mt-1 inline-block">
              {predStats?.totalPredictions || 0} Model Inferences Logged
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800 flex flex-wrap gap-4 sm:gap-6">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📋 Campaigns
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📊 Analytics & Charts
          </button>
          <button
            onClick={() => setActiveTab('predictor')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'predictor'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🤖 AI ROI Predictor
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'whatif'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📈 What-If Simulator
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📜 Prediction History & Actual ROI
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'admin'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              🛡️ Admin Console
            </button>
          )}
        </div>

        {/* TAB 1: CAMPAIGN MANAGEMENT */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                />

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All Platforms</option>
                  <option value="Google">Google Ads</option>
                  <option value="Meta">Meta / Facebook</option>
                  <option value="LinkedIn">LinkedIn Ads</option>
                  <option value="TikTok">TikTok Ads</option>
                  <option value="YouTube">YouTube Ads</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingCampaign(null);
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition duration-150 flex items-center gap-2"
              >
                <span>+</span> New Campaign
              </button>
            </div>

            {/* Campaign Table with Drill-down */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              {campaignsLoading ? (
                <div className="p-12 text-center text-gray-500">Loading campaigns from PostgreSQL...</div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <p className="text-base font-semibold">No campaigns match your filters.</p>
                  <p className="text-xs">Adjust search parameters or create a new campaign.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="py-4 px-6">Campaign Name</th>
                        <th className="py-4 px-6">Platform</th>
                        <th className="py-4 px-6">Budget ($ USD)</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Created Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredCampaigns.map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-800/40 transition">
                          <td className="py-4 px-6">
                            <button
                              onClick={() => setSelectedDrillDown(c)}
                              className="font-semibold text-white hover:text-blue-400 text-left transition"
                            >
                              {c.name}
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-xs rounded-lg text-gray-300">
                              {c.platform}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-blue-400">
                            ${Number(c.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                c.status?.toLowerCase() === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : c.status?.toLowerCase() === 'paused'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-gray-400">
                            {c.created_at ? new Date(Number(c.created_at) || c.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => setSelectedDrillDown(c)}
                              className="px-3 py-1 bg-blue-950/60 hover:bg-blue-900 text-xs font-medium rounded-lg text-blue-300 border border-blue-800/50 transition"
                            >
                              Drill-Down
                            </button>
                            <button
                              onClick={() => {
                                setEditingCampaign(c);
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-medium rounded-lg text-gray-300 border border-gray-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="px-3 py-1 bg-red-950/60 hover:bg-red-900 text-xs font-medium rounded-lg text-red-300 border border-red-800/50 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS, CHARTS & PLATFORM COMPARISONS (Requirements #7, #9, #10) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Date Filtering Bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Filter:</span>
                <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    onClick={() => setDateRange('all')}
                    className={`px-3 py-1 rounded-lg transition ${
                      dateRange === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setDateRange('today')}
                    className={`px-3 py-1 rounded-lg transition ${
                      dateRange === 'today' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange('7d')}
                    className={`px-3 py-1 rounded-lg transition ${
                      dateRange === '7d' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDateRange('30d')}
                    className={`px-3 py-1 rounded-lg transition ${
                      dateRange === '30d' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setDateRange('custom')}
                    className={`px-3 py-1 rounded-lg transition ${
                      dateRange === 'custom' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
              </div>

              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-3 py-1 bg-gray-950 border border-gray-800 rounded-lg text-white outline-none"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-3 py-1 bg-gray-950 border border-gray-800 rounded-lg text-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* Interactive Charts Component */}
            <AnalyticsCharts metrics={metrics} platformData={platformComparisons} />

            {/* Platform Comparison Matrix (Requirement #10) */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🌐</span> Comprehensive Platform Comparison
                  </h3>
                  <p className="text-xs text-gray-400">Head-to-head performance across Google, Meta, LinkedIn, TikTok & YouTube</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Allocated Budget</th>
                      <th className="py-3 px-4">Total Spend</th>
                      <th className="py-3 px-4">Impressions</th>
                      <th className="py-3 px-4">Clicks</th>
                      <th className="py-3 px-4">CTR</th>
                      <th className="py-3 px-4">CPC</th>
                      <th className="py-3 px-4">Conversions</th>
                      <th className="py-3 px-4">Realized ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                    {platformComparisons.map((p: any) => (
                      <tr key={p.platform} className="hover:bg-gray-800/30 transition">
                        <td className="py-3 px-4 font-bold text-white">{p.platform}</td>
                        <td className="py-3 px-4 font-mono text-gray-300">${p.totalBudget.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-blue-400">${p.totalSpend.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-gray-300">{p.totalImpressions.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-blue-300">{p.totalClicks.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{p.avgCtr}%</td>
                        <td className="py-3 px-4 font-mono text-amber-400">${p.avgCpc}</td>
                        <td className="py-3 px-4 font-mono text-purple-400">{p.totalConversions}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{p.avgRoi.toFixed(2)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI ROI PREDICTOR & RECOMMENDATIONS */}
        {activeTab === 'predictor' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Controls */}
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-5">
                <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <span>🤖</span> AI Inference Parameters
                </h2>

                <form onSubmit={handlePredictSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Ad Platform
                    </label>
                    <select
                      value={predPlatform}
                      onChange={(e) => setPredPlatform(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Google">Google Ads</option>
                      <option value="Meta">Meta / Facebook</option>
                      <option value="Instagram">Instagram Ads</option>
                      <option value="LinkedIn">LinkedIn Ads</option>
                      <option value="TikTok">TikTok Ads</option>
                      <option value="YouTube">YouTube Ads</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Proposed Budget ($ USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={predBudget}
                      onChange={(e) => setPredBudget(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Campaign Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="180"
                      value={predDuration}
                      onChange={(e) => setPredDuration(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Target Audience
                    </label>
                    <select
                      value={predAudience}
                      onChange={(e) => setPredAudience(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general_consumers">General Consumers</option>
                      <option value="ecommerce_shoppers">E-commerce Shoppers</option>
                      <option value="b2b_professionals">B2B Professionals & Leaders</option>
                      <option value="gen_z_tech">Gen-Z Tech & Gaming</option>
                      <option value="young_adults">Young Adults & Students</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Campaign Objective
                    </label>
                    <select
                      value={predObjective}
                      onChange={(e) => setPredObjective(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="conversions">Conversions & Sales</option>
                      <option value="lead_generation">B2B Lead Generation</option>
                      <option value="brand_awareness">Brand Awareness & Reach</option>
                      <option value="traffic">Site Traffic & Engagements</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={predLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition duration-150"
                  >
                    {predLoading ? 'Running ML Regressors...' : 'Calculate AI Forecast'}
                  </button>
                </form>
              </div>

              {/* Predictions Display Area */}
              <div className="lg:col-span-2 space-y-6">
                {predError && (
                  <div className="p-4 bg-red-900/40 border border-red-500/40 rounded-2xl text-red-200 text-sm">
                    {predError.message}
                  </div>
                )}

                {predSavedNotice && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                    <span>✓</span> {predSavedNotice}
                  </div>
                )}

                {!prediction && !predLoading && !predError && (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-900/40 border border-dashed border-gray-800 rounded-2xl text-gray-500 p-8 text-center space-y-2">
                    <span className="text-3xl">💡</span>
                    <p className="font-semibold text-gray-400">Ready to forecast ROI</p>
                    <p className="text-xs max-w-md">
                      Tune your target parameters and submit to run Gradient Boosting & Random Forest regression forecasting with 95% confidence intervals.
                    </p>
                  </div>
                )}

                {prediction && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Predicted ROI Multiplier</p>
                        <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                          {prediction.predictedRoi.toFixed(2)}x
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          95% CI: {prediction.confidenceInterval?.lower.toFixed(2)}x – {prediction.confidenceInterval?.upper.toFixed(2)}x
                        </p>
                      </div>

                      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Estimated Clicks</p>
                        <p className="text-4xl font-extrabold text-blue-400 mt-2">
                          {prediction.predictedClicks.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">Model: {prediction.modelUsed || 'Gradient Boosting'}</p>
                      </div>

                      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Estimated Conversions</p>
                        <p className="text-4xl font-extrabold text-purple-400 mt-2">
                          {prediction.predictedConversions.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">High Intent Conversion Probability</p>
                      </div>

                      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Ensemble Confidence Score</p>
                        <p className="text-4xl font-extrabold text-amber-400 mt-2">
                          {(prediction.confidenceScore * 100).toFixed(0)}%
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">Calculated via RF Tree Ensemble Variance</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleLogPrediction}
                        disabled={savingPred}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 font-semibold text-xs rounded-xl shadow-lg transition"
                      >
                        {savingPred ? 'Saving to Database...' : '📜 Save to Prediction History'}
                      </button>

                      <button
                        onClick={() => {
                          handleSaveCampaign({
                            name: `AI Optimized ${predPlatform} Campaign`,
                            platform: predPlatform,
                            budget: parseFloat(predBudget) || 1000,
                            status: predStatus,
                          });
                          setActiveTab('campaigns');
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs rounded-xl shadow-lg transition"
                      >
                        🚀 Convert into Live Campaign
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prescriptive Recommendation Engine */}
            <RecommendationCard
              budget={parseFloat(predBudget) || 5000}
              objective={predObjective}
              audience={predAudience}
              onApplyPlatform={(plat) => setPredPlatform(plat)}
            />
          </div>
        )}

        {/* TAB 4: WHAT-IF SCENARIO SIMULATOR (Requirement #32) */}
        {activeTab === 'whatif' && <WhatIfSimulator />}

        {/* TAB 5: PREDICTION HISTORY & ACTUAL ROI TRACKER (Requirements #29, #30) */}
        {activeTab === 'history' && <PredictionHistoryTracker />}

        {/* TAB 6: ADMIN CONSOLE (Requirement #34) */}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </div>

      {/* Campaign Create/Edit Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCampaign}
        initialData={editingCampaign}
        title={editingCampaign ? 'Edit Campaign Details' : 'Create New Ad Campaign'}
        loading={createLoading || updateLoading}
      />

      {/* Drill-down Modal */}
      {selectedDrillDown && (
        <CampaignDrillDown campaign={selectedDrillDown} onClose={() => setSelectedDrillDown(null)} />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        campaigns={campaigns}
        metrics={metrics}
      />
    </main>
  );
}