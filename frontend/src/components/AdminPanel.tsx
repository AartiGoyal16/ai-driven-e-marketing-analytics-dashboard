'use client';

import React from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_USERS, GET_SYSTEM_STATS, UPDATE_USER_ROLE_MUTATION } from '@/graphql/campaignMutations';

export default function AdminPanel() {
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery<any>(GET_SYSTEM_STATS, {
    fetchPolicy: 'network-only',
  });

  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery<any>(GET_ALL_USERS, {
    fetchPolicy: 'network-only',
  });

  const [updateUserRole, { loading: updatingRole }] = useMutation(UPDATE_USER_ROLE_MUTATION, {
    onCompleted: () => {
      refetchUsers();
      refetchStats();
    },
  });

  const stats = statsData?.getSystemStats;
  const users = usersData?.getAllUsers || [];

  const handleToggleRole = (id: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUserRole({ variables: { id, role: nextRole } });
  };

  return (
    <div className="space-y-6">
      {/* System Telemetry & Health */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🛡️</span> Admin Console & System Statistics
            </h3>
            <p className="text-xs text-gray-400">Microservice infrastructure diagnostics and cache health</p>
          </div>
          <button
            onClick={() => {
              refetchStats();
              refetchUsers();
            }}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-xl transition"
          >
            ↻ Refresh Telemetry
          </button>
        </div>

        {statsLoading ? (
          <div className="p-8 text-center text-gray-500 text-xs">Loading system diagnostics...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Registered Users</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
              <span className="text-[10px] text-gray-500">PostgreSQL auth store</span>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Active ML Algorithm</p>
              <p className="text-lg font-bold text-blue-400 mt-1 truncate">{stats.bestModel}</p>
              <span className="text-[10px] text-emerald-400">● {stats.mlEngineStatus}</span>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Redis Cache Hit Rate</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.cache?.hitRate || '0.0%'}</p>
              <span className="text-[10px] text-gray-400">
                {stats.cache?.hits || 0} hits / {stats.cache?.misses || 0} misses
              </span>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Cached Prediction Keys</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.cache?.totalKeys || 0}</p>
              <span className="text-[10px] text-gray-400">TTL 3600s active</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* User Accounts Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <div>
            <h4 className="text-sm font-bold text-white">User Accounts & Role Permissions</h4>
            <p className="text-xs text-gray-400">Manage user access levels between standard User and system Admin</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
              {usersLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-white">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        disabled={updatingRole}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] rounded-lg transition"
                      >
                        Change to {u.role === 'admin' ? 'User' : 'Admin'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
