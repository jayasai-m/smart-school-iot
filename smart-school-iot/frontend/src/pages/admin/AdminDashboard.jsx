import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import {
  Building2,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Eye,
  CheckSquare,
  ArrowRight,
  Droplets,
  UtensilsCrossed,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    total_approved_schools: 0,
    pending_approvals: 0,
    active_alerts: 0,
    hardware_connected: 0
  };

  const schools = data?.schools_overview || [];
  const alerts = data?.recent_alerts || [];
  const images = data?.recent_images || [];
  const meals = data?.recent_meals || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Overview Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry and mid-day meal verification status across monitored institutions
          </p>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchDashboard(); }}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Approved Schools */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Approved Schools</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats.total_approved_schools}</span>
            <span className="text-[11px] text-slate-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Institutions monitored in network</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Approvals</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats.pending_approvals}</span>
            <span className="text-[11px] text-slate-400">Awaiting Review</span>
          </div>
          <div className="mt-1">
            {stats.pending_approvals > 0 ? (
              <Link to="/admin/approvals" className="text-[11px] text-amber-400 hover:underline font-medium">
                Review registrations →
              </Link>
            ) : (
              <p className="text-[11px] text-slate-500">No pending registrations</p>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Alerts</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats.active_alerts}</span>
            <span className="text-[11px] text-slate-400">Unresolved</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.active_alerts === 0 ? "No Active Alerts" : "Threshold anomalies detected"}
          </p>
        </div>

        {/* Hardware Connections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Hardware Connections</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats.hardware_connected}</span>
            <span className="text-[11px] text-slate-400">Online ESP32s</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.hardware_connected === 0 ? "Hardware Not Connected" : "Transmitting live telemetry"}
          </p>
        </div>
      </div>

      {/* Approved Schools Live Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Monitored Schools Telemetry Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Physical sensor status for all approved institutions</p>
          </div>
          <Link
            to="/admin/schools"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">School Name & Code</th>
                <th className="px-5 py-3 font-semibold">District</th>
                <th className="px-5 py-3 font-semibold">Hardware Status</th>
                <th className="px-5 py-3 font-semibold">Tank Level</th>
                <th className="px-5 py-3 font-semibold">Water Turbidity</th>
                <th className="px-5 py-3 font-semibold">Kitchen Humidity</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {schools.map((s) => {
                const isOnline = s.hardware_status === 'CONNECTED';
                const r = s.latest_reading;
                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.school_code}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{s.district}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                            ESP32 Connected
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1 text-slate-500" />
                            Hardware Not Connected
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {r && r.water_level_pct !== undefined ? (
                        <span className="text-slate-200 font-bold">{r.water_level_pct}% ({r.water_volume_litres} L)</span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {r && r.turbidity_ntu !== undefined ? (
                        <span className="text-slate-200">{r.turbidity_ntu} NTU</span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {r && r.humidity_pct !== undefined ? (
                        <span className="text-slate-200">{r.humidity_pct}%</span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/schools/${s.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 font-medium text-[11px] transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Grid: Recent Alerts & Recent Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-white">System Anomalies & Alerts</h3>
            </div>
            <Link to="/admin/alerts" className="text-xs text-teal-400 hover:underline">
              All Alerts →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No Active Alerts
              </div>
            ) : (
              alerts.slice(0, 5).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                      {a.alert_type}
                    </span>
                    <p className="text-xs text-slate-200 font-medium mt-1.5">{a.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    a.status === 'ACTIVE' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Photo Submissions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm text-white">Recent Staff Photo Submissions</h3>
            </div>
            <Link to="/admin/meals" className="text-xs text-teal-400 hover:underline">
              Verify Photos →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {images.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No Submissions Yet
              </div>
            ) : (
              images.slice(0, 5).map((img) => (
                <div key={img.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={img.image_url}
                      alt="Thumbnail"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                    />
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase">
                        {img.category === 'MEAL_PREPARATION' ? 'Meal Prep' : img.category === 'STUDENT_EATING' ? 'Students Eating' : 'Hygiene'}
                      </span>
                      <p className="text-xs font-semibold text-slate-200 mt-1">{img.meal_type || 'Photo Submission'}</p>
                      <p className="text-[10px] text-slate-500">Cook: {img.staff_name || 'Staff'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    img.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    img.status === 'FLAGGED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    img.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {img.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
