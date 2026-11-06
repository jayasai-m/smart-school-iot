import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import { User, ShieldCheck, Mail, LogOut, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminService.getAuditLogs();
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Administrator Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          State Nodal Management credentials & system audit trails
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xl">
            AD
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.full_name || 'State Monitoring Administrator'}</h2>
            <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Role: {user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block">Official Email</span>
            <strong className="text-white font-mono text-sm">{user?.email || 'admin@gmail.com'}</strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block">Access Clearance</span>
            <strong className="text-emerald-400 text-sm">System-Wide All Schools</strong>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/25 flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Administration Portal</span>
          </button>
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <History className="w-4 h-4 text-teal-400" />
          <span>Security & Action Audit Logs</span>
        </h3>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No audit records logged yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-400 font-mono">{log.action}</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">{log.details}</p>
                  <span className="text-[10px] text-slate-500">By: {log.user_email}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
