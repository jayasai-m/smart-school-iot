import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import {
  Building2,
  Droplets,
  Gauge,
  UtensilsCrossed,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { StaffUploadModal } from '../../components/StaffUploadModal';

export const SchoolDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { t } = useLang();

  const fetchDashboard = async () => {
    try {
      const res = await schoolService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const { school, hardware, latest_reading, active_alerts_count, recent_alerts, today_meal, recent_images } = data || {};
  const isConnected = hardware?.status === 'CONNECTED';
  const hasSensorData = isConnected && latest_reading !== null && latest_reading !== undefined;

  return (
    <div className="space-y-6">
      {/* Node Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{school?.name || 'ZPHS Poranki'}</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              {school?.school_code || 'SCH-PORANKI-001'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            District: {school?.district}, {school?.state} • Hardware Node ID: {school?.hardware_device_id}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-teal-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('uploadPhoto')}</span>
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchDashboard(); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Sensor Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hardware Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('hardwareStatus')}</span>
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div className="mt-3">
            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {hardware?.label || (isConnected ? t('connected') : t('disconnected'))}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isConnected ? 'Telemetry active' : t('sensorOffline')}
          </p>
        </div>

        {/* Water Tank Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('waterLevel')}</span>
            <Gauge className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {hasSensorData ? `${latest_reading.water_level_pct}%` : '--'}
            </span>
            <span className="text-xs text-slate-400">
              {hasSensorData ? `(${latest_reading.water_volume_litres} L)` : `(${t('noData')})`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Capacity: {school?.tank_capacity_litres} Litres
          </p>
        </div>

        {/* Drinking Water Turbidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('turbidity')}</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {hasSensorData ? `${latest_reading.turbidity_ntu} NTU` : '--'}
            </span>
          </div>
          <p className="text-[11px] mt-1 font-medium">
            {hasSensorData ? (
              <span className={latest_reading.turbidity_status === 'GOOD' ? 'text-emerald-400' : 'text-rose-400'}>
                Quality: {latest_reading.turbidity_status}
              </span>
            ) : (
              <span className="text-slate-500">{t('sensorOffline')}</span>
            )}
          </p>
        </div>

        {/* Kitchen Humidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('humidity')}</span>
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {hasSensorData ? `${latest_reading.humidity_pct}%` : '--'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasSensorData ? `Status: ${latest_reading.humidity_status}` : t('noData')}
          </p>
        </div>
      </div>

      {/* Middle Grid: Today's Meal & Active Node Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meal Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4 text-teal-400" />
              <span>{t('todayMeal')}</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleDateString()}</span>
          </div>

          {today_meal ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Menu: </span>
                <strong className="text-teal-400 text-sm">{today_meal.meal_type}</strong>
              </div>
              <p className="text-slate-300">{today_meal.menu_description}</p>
              <div className="pt-2 flex justify-between text-slate-400 text-[11px]">
                <span>Cook / Staff: <strong className="text-slate-200">{today_meal.staff_name}</strong></span>
                <span>Shift: <strong className="text-slate-200">{today_meal.inspection_shift}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs italic">
              No meal logged for today yet. Use the Meal & Kitchen page to register today's preparation.
            </div>
          )}
        </div>

        {/* School Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Institution Incidents & Alerts</span>
            </h3>
            <span className="text-xs text-rose-400 font-mono font-bold">{active_alerts_count} Active</span>
          </div>

          {recent_alerts && recent_alerts.length > 0 ? (
            <div className="space-y-2">
              {recent_alerts.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">{a.alert_type}</span>
                    <p className="text-slate-200 mt-0.5">{a.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs italic">
              No Active Alerts. All parameters are normal.
            </div>
          )}
        </div>
      </div>

      <StaffUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        schoolName={school?.name}
        onUploadSuccess={fetchDashboard}
      />
    </div>
  );
};
