import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  FileBarChart,
  Building2,
  RefreshCw,
  Droplets,
  UtensilsCrossed,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  const fetchReports = async () => {
    try {
      const res = await adminService.getReports(selectedSchoolId);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedSchoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const { schools, selected_school, has_sensor_data, readings, alerts, summary } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Compliance Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical audit analytics generated strictly from stored database records
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-teal-400" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {schools?.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Total Meal Records</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{summary?.total_meals || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Verified Photos</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{summary?.images_verified || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Flagged Photos</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{summary?.images_flagged || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Pending Review</span>
          <p className="text-2xl font-bold font-mono text-teal-400 mt-1">{summary?.images_pending || 0}</p>
        </div>
      </div>

      {/* Historical Telemetry Report */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-2">Sensor History Log – {selected_school?.name}</h3>
        {!has_sensor_data ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No historical data available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Water Level</th>
                  <th className="px-4 py-2.5">Litres</th>
                  <th className="px-4 py-2.5">Turbidity</th>
                  <th className="px-4 py-2.5">Humidity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {readings.map((r) => (
                  <tr key={r.id} className="font-mono text-slate-300">
                    <td className="px-4 py-2">{new Date(r.recorded_at).toLocaleString()}</td>
                    <td className="px-4 py-2">{r.water_level_pct}%</td>
                    <td className="px-4 py-2">{r.water_volume_litres} L</td>
                    <td className="px-4 py-2">{r.turbidity_ntu} NTU</td>
                    <td className="px-4 py-2">{r.humidity_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
