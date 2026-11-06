import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  UserCheck,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  ChevronRight,
  Droplets,
  UtensilsCrossed,
  X,
  XCircle,
  FileCheck2,
  Eye,
  Camera,
  Activity
} from 'lucide-react';

export const AdminInspectors = () => {
  const [inspectors, setInspectors] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspectorId, setSelectedInspectorId] = useState(null);
  const [inspectorProgress, setInspectorProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  
  // Assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningInspector, setAssigningInspector] = useState(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchInspectors = async () => {
    try {
      const [insRes, schoolsRes] = await Promise.all([
        adminService.getInspectors(),
        adminService.getAvailableSchools()
      ]);
      setInspectors(insRes.data);
      setAvailableSchools(schoolsRes.data);
      
      // Auto-select first inspector if none selected
      if (insRes.data.length > 0 && !selectedInspectorId) {
        setSelectedInspectorId(insRes.data[0].id);
        fetchProgress(insRes.data[0].id);
      } else if (selectedInspectorId) {
        fetchProgress(selectedInspectorId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (inspectorId) => {
    setProgressLoading(true);
    try {
      const res = await adminService.getInspectorProgress(inspectorId);
      setInspectorProgress(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectors();
  }, []);

  const handleSelectInspector = (id) => {
    setSelectedInspectorId(id);
    fetchProgress(id);
  };

  const openAssignModal = (inspector, e) => {
    if (e) e.stopPropagation();
    setAssigningInspector(inspector);
    setSelectedSchoolIds(inspector.assigned_schools.map((s) => s.id));
    setIsAssignModalOpen(true);
  };

  const toggleSchoolSelection = (schoolId) => {
    if (selectedSchoolIds.includes(schoolId)) {
      setSelectedSchoolIds(selectedSchoolIds.filter((id) => id !== schoolId));
    } else {
      setSelectedSchoolIds([...selectedSchoolIds, schoolId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningInspector) return;
    setAssignLoading(true);
    setActionMessage('');
    try {
      await adminService.assignSchoolsToInspector(assigningInspector.id, selectedSchoolIds);
      setActionMessage(`Schools assigned successfully to ${assigningInspector.full_name}!`);
      setIsAssignModalOpen(false);
      fetchInspectors();
    } catch (err) {
      console.error(err);
      setActionMessage('Failed to update school assignments.');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const activeInspectorsCount = inspectors.filter((i) => i.status === 'ACTIVE').length;
  const totalAssignedSchools = inspectors.reduce((acc, curr) => acc + curr.assigned_schools_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Field Inspectors & Compliance Tracking</h1>
          <p className="text-xs text-slate-400 mt-1">
            Assign government schools to field inspectors and monitor real-time verification of water telemetry and mid-day meals
          </p>
        </div>

        <button
          onClick={fetchInspectors}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inspectors</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{inspectors.length}</p>
          <span className="text-[11px] text-teal-400 font-medium">Registered Inspectors</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Monitoring</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{activeInspectorsCount}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Approved & Field Active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Schools Under Inspection</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalAssignedSchools}</p>
          <span className="text-[11px] text-cyan-400 font-medium">Institutions Monitored</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Schools</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{availableSchools.length}</p>
          <span className="text-[11px] text-purple-400 font-medium">Active Government Schools</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inspectors List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>Select Inspector ({inspectors.length})</span>
            </h2>
            <span className="text-[10px] text-slate-500">Click to view progress</span>
          </div>

          {inspectors.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
              No field inspectors found. Newly registered inspectors will appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {inspectors.map((ins) => {
                const isSelected = selectedInspectorId === ins.id;
                return (
                  <div
                    key={ins.id}
                    onClick={() => handleSelectInspector(ins.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500/50 shadow-xl shadow-teal-500/5 ring-1 ring-teal-500/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-800 text-teal-400 border border-slate-700'
                        }`}>
                          {ins.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h3 className="text-xs font-bold text-white truncate">{ins.full_name}</h3>
                          <p className="text-[11px] text-teal-400 font-medium truncate">{ins.district}</p>
                          <p className="text-[10px] text-slate-500 truncate">{ins.email}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 uppercase tracking-wider ${
                        ins.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {ins.status}
                      </span>
                    </div>

                    {/* Progress preview footer on card */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-white">{ins.assigned_schools_count}</span>
                        <span className="text-slate-500 text-[11px]">Schools</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => openAssignModal(ins, e)}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Assign Schools
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Progress & Assigned Schools Monitor */}
        <div className="lg:col-span-8">
          {progressLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : inspectorProgress ? (
            <div className="space-y-4">
              {/* Inspector Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-teal-500/20">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h2 className="text-lg font-bold text-white">{inspectorProgress.inspector.full_name}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {inspectorProgress.inspector.status}
                        </span>
                      </div>
                      <p className="text-xs text-teal-400 font-medium">
                        {inspectorProgress.inspector.district} • Contact: {inspectorProgress.inspector.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const ins = inspectors.find((i) => i.id === selectedInspectorId);
                      if (ins) openAssignModal(ins);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-teal-500/20 hover:opacity-95 transition-opacity cursor-pointer shrink-0"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Manage Assigned Schools</span>
                  </button>
                </div>

                {/* Progress Bar & Summary Stats */}
                <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Assigned</span>
                    <p className="text-lg font-black text-white mt-0.5">{inspectorProgress.stats.total_assigned_schools}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Verified Today</span>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">{inspectorProgress.stats.verified_today}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 uppercase font-semibold">Pending Review</span>
                    <p className="text-lg font-black text-amber-400 mt-0.5">{inspectorProgress.stats.pending_review}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">No Upload Today</span>
                    <p className="text-lg font-black text-slate-400 mt-0.5">{inspectorProgress.stats.no_submission_today}</p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 text-[11px]">Today's Inspection Completion Rate</span>
                    <span className="font-bold text-teal-400">{inspectorProgress.stats.compliance_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${inspectorProgress.stats.compliance_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Schools List Header */}
              <div className="flex items-center justify-between pt-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span>Assigned Schools & Real-Time Verification Status</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {inspectorProgress.schools.length} school(s) under supervision
                </span>
              </div>

              {/* Schools Cards */}
              {inspectorProgress.schools.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                  <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Schools Assigned Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Manage Assigned Schools" above to assign government schools to this inspector.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectorProgress.schools.map((s) => {
                    // Status Badge config
                    let statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        NO SUBMISSION TODAY
                      </span>
                    );
                    if (s.verification_status === 'VERIFIED') {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>VERIFIED BY INSPECTOR</span>
                        </span>
                      );
                    } else if (s.verification_status === 'PENDING_REVIEW') {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>AWAITING VERIFICATION</span>
                        </span>
                      );
                    } else if (s.verification_status === 'FLAGGED') {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>FLAGGED FOR ATTENTION</span>
                        </span>
                      );
                    }

                    return (
                      <div
                        key={s.school_id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
                      >
                        {/* School Top Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-white">{s.school_name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {s.school_code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {s.district} • Principal: {s.principal_name} ({s.phone})
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {statusBadge}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              s.hardware_status === 'CONNECTED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {s.hardware_label}
                            </span>
                          </div>
                        </div>

                        {/* Telemetry and Verification Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {/* Physical Water & Tank Telemetry */}
                          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1.5">
                              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Overhead Tank & Drinking Water</span>
                            </span>
                            {s.latest_reading?.water_level_pct !== null && s.latest_reading?.water_level_pct !== undefined ? (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400">Fill Level:</span>
                                  <span className="font-bold text-white">
                                    {s.latest_reading.water_level_pct}% ({s.latest_reading.water_volume_litres} L)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: `${Math.min(100, s.latest_reading.water_level_pct)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs pt-1">
                                  <span className="text-slate-400">Turbidity:</span>
                                  <span className={`font-semibold ${s.latest_reading.turbidity_ntu <= 5.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {s.latest_reading.turbidity_ntu} NTU ({s.latest_reading.turbidity_ntu <= 5.0 ? 'Safe' : 'Abnormal'})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 pt-1">No physical sensor telemetry recorded yet.</p>
                            )}
                          </div>

                          {/* Mid-Day Meal Compliance */}
                          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1.5">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                              <span>Mid-Day Meal & Kitchen Audit</span>
                            </span>

                            {s.verified_by ? (
                              <div className="space-y-1 text-xs pt-1">
                                <p className="text-slate-300">
                                  <span className="text-slate-500">Reviewer:</span> {s.verified_by}
                                </p>
                                {s.verified_at && (
                                  <p className="text-[11px] text-slate-500">
                                    Reviewed at: {new Date(s.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                                {s.verification_notes && (
                                  <p className="text-[11px] text-teal-300 italic">
                                    "{s.verification_notes}"
                                  </p>
                                )}
                              </div>
                            ) : s.today_has_submission ? (
                              <p className="text-[11px] text-amber-300 pt-1">
                                Staff submitted {s.today_images_count} meal photograph(s) today. Pending inspector review.
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 pt-1">
                                No meal or kitchen preparation photographs uploaded for today yet.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Today's Photo Submissions Preview */}
                        {s.today_images && s.today_images.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                              Today's Uploaded Photographs ({s.today_images.length})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {s.today_images.map((img) => (
                                <div key={img.id} className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                                  <img
                                    src={img.image_url}
                                    alt={img.meal_type || 'Meal'}
                                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="p-1.5 bg-slate-900/90 text-[10px]">
                                    <p className="font-semibold text-white truncate">{img.meal_type || img.category}</p>
                                    {img.cv_student_count !== null && img.cv_student_count !== undefined && (
                                      <p className="text-teal-400 font-mono text-[9px]">Students: ~{img.cv_student_count}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
              Select an inspector from the left to view monitored schools and verification progress.
            </div>
          )}
        </div>
      </div>

      {/* ASSIGN SCHOOLS MODAL */}
      {isAssignModalOpen && assigningInspector && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Assign Government Schools</h3>
                <p className="text-xs text-teal-400 font-medium">
                  Field Inspector: {assigningInspector.full_name}
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select the schools that this inspector will be responsible for monitoring and verifying:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {availableSchools.map((school) => {
                const isChecked = selectedSchoolIds.includes(school.id);
                return (
                  <div
                    key={school.id}
                    onClick={() => toggleSchoolSelection(school.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-teal-500/15 border-teal-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{school.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {school.school_code} • {school.district}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-teal-500 rounded border-slate-700 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedSchoolIds.length} school(s) selected
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignLoading}
                  onClick={handleSaveAssignments}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:opacity-90 disabled:opacity-50"
                >
                  {assignLoading ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
