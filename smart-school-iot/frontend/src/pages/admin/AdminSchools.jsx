import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { Building2, Eye, Wifi, WifiOff, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const AdminSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchools = async () => {
    try {
      const res = await adminService.getSchools();
      setSchools(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Multi-School Management Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered government institutions under state monitoring
          </p>
        </div>

        <button
          onClick={fetchSchools}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">School Name & Code</th>
                <th className="px-5 py-3.5 font-semibold">Location</th>
                <th className="px-5 py-3.5 font-semibold">Account Status</th>
                <th className="px-5 py-3.5 font-semibold">Hardware Link</th>
                <th className="px-5 py-3.5 font-semibold">Live Tank Level</th>
                <th className="px-5 py-3.5 font-semibold">Active Alerts</th>
                <th className="px-5 py-3.5 font-semibold text-right">Action</th>
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
                      <div className="text-[10px] text-teal-400 font-mono mt-0.5">{s.school_code}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <div>{s.district}, {s.state}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{s.address}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        s.status === 'PENDING_APPROVAL' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isOnline ? (
                          <>
                            <Wifi className="w-3 h-3 mr-1 text-emerald-400" />
                            Connected
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1 text-slate-500" />
                            Disconnected
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-200">
                      {r && r.water_level_pct !== undefined ? `${r.water_level_pct}% (${r.water_volume_litres} L)` : '--'}
                    </td>
                    <td className="px-5 py-4">
                      {s.active_alerts_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold font-mono text-[10px]">
                          {s.active_alerts_count} Active
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No Alerts</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/schools/${s.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
};
