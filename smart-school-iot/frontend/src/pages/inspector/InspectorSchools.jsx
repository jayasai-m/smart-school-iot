import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectorService } from '../../services/api';
import {
  Building2,
  Droplets,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

export const InspectorSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSchools = async () => {
    try {
      const res = await inspectorService.getSchools();
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

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Supervised Institutions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Schools assigned under your mandal inspection jurisdiction for water safety and mid-day meal audits
          </p>
        </div>

        <button
          onClick={fetchSchools}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by school name, code, or district..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {filteredSchools.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 text-xs">
          {schools.length === 0
            ? 'No government schools have been assigned to your profile yet. Please contact the Central State Administrator.'
            : 'No schools match your search query.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchools.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{s.name}</h3>
                  <p className="text-[11px] font-mono text-teal-400 mt-0.5">{s.school_code}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.district}</p>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  s.hardware_status === 'CONNECTED'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {s.hardware_label}
                </span>
              </div>

              {/* Status details */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Headmaster:</span>
                  <span className="font-semibold text-slate-200">{s.principal_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{s.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Tank:</span>
                  <span className="font-bold text-white">
                    {s.latest_reading?.water_level_pct !== null && s.latest_reading?.water_level_pct !== undefined
                      ? `${s.latest_reading.water_level_pct}% (${s.latest_reading.water_volume_litres} L)`
                      : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turbidity:</span>
                  <span className="font-semibold text-white">
                    {s.latest_reading?.turbidity_ntu !== null && s.latest_reading?.turbidity_ntu !== undefined
                      ? `${s.latest_reading.turbidity_ntu} NTU`
                      : '--'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Meal Audit Today:</span>
                  <span className={`font-bold ${
                    s.verification_status_today === 'VERIFIED'
                      ? 'text-emerald-400'
                      : s.verification_status_today === 'PENDING_REVIEW'
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}>
                    {s.verification_status_today}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-1">
                <Link
                  to={`/inspector/digital-twin?school_id=${s.id}`}
                  className="flex-1 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Digital Twin</span>
                </Link>

                <Link
                  to={`/inspector/meals?school_id=${s.id}`}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Meal Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
