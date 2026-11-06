import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import {
  Droplets,
  Gauge,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const SchoolWater = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWater = async () => {
    try {
      const res = await schoolService.getWater();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWater();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const { school, hardware, latest, history } = data || {};
  const isConnected = hardware?.status === 'CONNECTED';
  const hasData = isConnected && latest !== null && latest !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Water Quality & Tank Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real physical sensor metrics for {school?.name}
          </p>
        </div>

        <button
          onClick={fetchWater}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Quality */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <span>Drinking Water Quality</span>
            </h2>
            <span className="text-xs text-slate-400">Limit: {school?.turbidity_threshold} NTU</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-xs text-slate-400">Turbidity</p>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {hasData ? `${latest.turbidity_ntu} NTU` : '--'}
              </span>
              <span className={`text-xs font-bold uppercase ${
                hasData && latest.turbidity_status === 'GOOD' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {hasData ? `Quality: ${latest.turbidity_status}` : 'Sensor Disconnected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Optical Sensor Link</span>
              <p className="font-semibold text-slate-200 mt-0.5">{hardware?.label}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Last Telemetry</span>
              <p className="font-mono text-slate-200 mt-0.5">
                {hasData ? new Date(latest.recorded_at).toLocaleTimeString() : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Water Tank */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-teal-400" />
              <span>Water Tank Reservoir</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Cap: {school?.tank_capacity_litres} L</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-xs text-slate-400">Water Volume</p>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {hasData ? `${latest.water_level_pct}%` : '--'}
              </span>
              <span className="text-xs text-slate-400">
                {hasData ? `(${latest.water_volume_litres} Litres)` : '(No Data Available)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Ultrasonic Echo Status</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {hasData ? latest.ultrasonic_status : 'Disconnected'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Reserve Condition</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {hasData && latest.ultrasonic_status === 'LOW' ? (
                  <span className="text-amber-400">Low Water Alert</span>
                ) : hasData && latest.ultrasonic_status === 'OVERFLOW' ? (
                  <span className="text-rose-400">Overflow Warning</span>
                ) : hasData ? (
                  <span className="text-emerald-400">Normal</span>
                ) : (
                  <span className="text-slate-500">--</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4">Historical Readings Timeline</h3>
        {!history || history.length === 0 ? (
          <div className="text-center py-14 text-slate-500 text-xs italic bg-slate-950 rounded-xl border border-dashed border-slate-800">
            <WifiOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No Historical Data Available</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Physical ESP32 readings will be archived here automatically</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="recorded_at" tickFormatter={(val) => new Date(val).toLocaleTimeString()} stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="water_level_pct" name="Water Level (%)" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="turbidity_ntu" name="Turbidity (NTU)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
