import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Building2,
  UserCheck,
  Mail,
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('SCHOOLS'); // 'SCHOOLS' or 'INSPECTORS'
  const [pendingSchools, setPendingSchools] = useState([]);
  const [pendingInspectors, setPendingInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchApprovals = async () => {
    try {
      const [schoolsRes, inspectorsRes] = await Promise.all([
        adminService.getApprovals(),
        adminService.getPendingInspectors()
      ]);
      setPendingSchools(schoolsRes.data);
      setPendingInspectors(inspectorsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleSchoolAction = async (schoolId, action) => {
    setActionLoading(true);
    setStatusMessage('');
    try {
      await adminService.processApproval(schoolId, action, `Processed via State Nodal Approval Portal`);
      setStatusMessage(`School #${schoolId} was successfully marked as ${action}!`);
      fetchApprovals();
    } catch (err) {
      console.error(err);
      setStatusMessage('Error updating school registration status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectorAction = async (inspectorId, action) => {
    setActionLoading(true);
    setStatusMessage('');
    try {
      await adminService.processInspectorApproval(inspectorId, action, `Processed via State Nodal Portal`);
      setStatusMessage(`Field Inspector #${inspectorId} was successfully marked as ${action}!`);
      fetchApprovals();
    } catch (err) {
      console.error(err);
      setStatusMessage('Error updating inspector request status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Institutional & Inspector Approvals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, verify, and authorize new government school nodes and field inspectors for network activation
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('SCHOOLS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'SCHOOLS'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>School Registrations</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${pendingSchools.length > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'bg-slate-800 text-slate-400'}`}>
            {pendingSchools.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INSPECTORS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'INSPECTORS'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Field Inspector Requests</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${pendingInspectors.length > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'bg-slate-800 text-slate-400'}`}>
            {pendingInspectors.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SCHOOL APPROVALS */}
      {activeTab === 'SCHOOLS' && (
        pendingSchools.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <CheckSquare className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No Pending School Approvals</h3>
            <p className="text-xs text-slate-500 mt-1">
              All registered government school applications have been reviewed and verified.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingSchools.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-white">{s.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                      {s.school_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Location:</span>
                      <span>{s.district}, {s.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Headmaster / Principal:</span>
                      <span>{s.principal_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Contact Info:</span>
                      <span>{s.email} • {s.phone}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Submitted on: {new Date(s.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleSchoolAction(s.id, 'APPROVE')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APPROVE</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleSchoolAction(s.id, 'FLAG')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>FLAG</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleSchoolAction(s.id, 'REJECT')}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECT</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 2: INSPECTOR APPROVALS */}
      {activeTab === 'INSPECTORS' && (
        pendingInspectors.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No Pending Inspector Requests</h3>
            <p className="text-xs text-slate-500 mt-1">
              All field inspector onboarding submissions have been reviewed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingInspectors.map((ins) => (
              <div
                key={ins.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-white">{ins.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      FIELD INSPECTOR
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                      PENDING APPROVAL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">District / Jurisdiction:</span>
                      <span className="font-semibold text-teal-400">{ins.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Official Email:</span>
                      <span>{ins.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Phone Number:</span>
                      <span>{ins.phone}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Requested on: {new Date(ins.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleInspectorAction(ins.id, 'APPROVE')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPT INSPECTOR</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleInspectorAction(ins.id, 'REJECT')}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECT</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
