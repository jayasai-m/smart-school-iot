import React, { useEffect, useState } from 'react';
import { inspectorService } from '../../services/api';
import {
  Droplets,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Building2,
  RefreshCw,
  Clock,
  WifiOff
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

export const InspectorWater = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWater = async (schoolId) => {
    try {
      const res = await inspectorService.getWater(schoolId);
      setSchools(res.data.schools || []);
      setWaterData(res.data);
      if (res.data.selected_school && !selectedSchoolId) {
        setSelectedSchoolId(res.data.selected_school.id);
      }
    } catch (err) {
      console.error("Water monitoring fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWater(selectedSchoolId);
    const interval = setInterval(() => {
      fetchWater(selectedSchoolId);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSchoolId]);

  const handleSchoolChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedSchoolId(id);
    setLoading(true);
    fetchWater(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const school = waterData?.selected_school;
  const latest = waterData?.latest;
  const history = waterData?.history || [];

  const chartData = history.map((item) => ({
    time: new Date(item.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    water_level: item.water_level_pct,
    turbidity: item.turbidity_ntu
  }));

  const isConnected = school?.hardware_status === 'CONNECTED';
  const hasData = isConnected && latest !== null && latest !== undefined;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Water Quality & Tank Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time optical clarity monitoring (NTU) and ultrasonic tank levels for assigned schools
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {schools.length > 0 && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Building2 className="w-4 h-4 text-teal-400" />
              <select
                value={selectedSchoolId || ''}
                onChange={handleSchoolChange}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => { setRefreshing(true); fetchWater(selectedSchoolId); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {schools.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 text-xs">
          No schools assigned to your inspection jurisdiction yet.
        </div>
      ) : (
        <>
          {/* Real-Time Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Tank Water Level</span>
                <Droplets className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white mt-2">
                {hasData ? `${latest.water_level_pct}%` : '--'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {hasData ? `${latest.water_volume_litres} Litres remaining` : 'Hardware offline'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Optical Turbidity</span>
                <Gauge className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-3xl font-black text-white mt-2">
                {hasData ? `${latest.turbidity_ntu} NTU` : '--'}
              </p>
              <p className={`text-xs mt-1 font-semibold ${
                hasData && latest.turbidity_ntu <= 5.0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {hasData ? (latest.turbidity_ntu <= 5.0 ? 'WHO/BIS Safe Drinking Water' : 'Contamination Alert') : 'Hardware offline'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Ultrasonic Distance</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-white mt-2">
                {hasData ? `${latest.distance_cm} cm` : '--'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Air gap to water surface</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>ESP32 Node Status</span>
                {isConnected ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-slate-500" />}
              </div>
              <p className={`text-xl font-bold mt-2 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                {school?.hardware_label || 'Disconnected'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {school?.last_hardware_ping ? `Last: ${new Date(school.last_hardware_ping).toLocaleTimeString()}` : 'Never connected'}
              </p>
            </div>
          </div>

          {/* Telemetry Charts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Sensor Telemetry History</span>
            </h3>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No historical telemetry points available for this institution.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="water_level" name="Water Level (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
