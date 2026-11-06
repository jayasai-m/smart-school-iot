import React from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, Clock, Droplets, Gauge } from 'lucide-react';

export const WaterTankDigitalTwin = ({
  schoolName,
  tankCapacity = 2000,
  tankHeight = 200,
  sensorData = null,
  hardwareStatus = 'DISCONNECTED',
  hardwareLabel = 'Hardware Not Connected',
  lastUpdate = null
}) => {
  const isConnected = hardwareStatus === 'CONNECTED';
  const hasData = isConnected && sensorData !== null && sensorData !== undefined;

  // Real values or strict placeholders
  const waterLevelPct = hasData && sensorData.water_level_pct !== undefined ? sensorData.water_level_pct : null;
  const waterLitres = hasData && sensorData.water_volume_litres !== undefined ? sensorData.water_volume_litres : null;
  const distanceCm = hasData && sensorData.distance_cm !== undefined ? sensorData.distance_cm : null;
  const ultrasonicStatus = hasData ? (sensorData.ultrasonic_status || 'NORMAL') : 'DISCONNECTED';
  const turbidityNtu = hasData && sensorData.turbidity_ntu !== undefined ? sensorData.turbidity_ntu : null;
  const turbidityStatus = hasData ? (sensorData.turbidity_status || 'GOOD') : 'DISCONNECTED';

  // Dynamic tank water appearance based on real turbidity
  const isTurbid = turbidityStatus === 'POOR' || (turbidityNtu && turbidityNtu > 5.0);
  const waterColorClass = isTurbid
    ? 'from-amber-600/70 via-amber-700/80 to-amber-900/90'
    : 'from-cyan-400/80 via-blue-500/85 to-indigo-600/90';

  const waterSurfaceColor = isTurbid ? '#d97706' : '#38bdf8';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-100">Physical Water Tank Digital Twin</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-semibold uppercase tracking-wider">
              IoT Twin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time cyber-physical model for <span className="text-slate-200 font-medium">{schoolName || 'ZPHS Poranki'}</span>
          </p>
        </div>

        {/* Hardware Status Pill */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>{hardwareLabel || 'ESP32 Connected'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                <span>{hardwareLabel || 'Hardware Not Connected'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Twin Graphic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-center">
        {/* Left Column: Visual Tank Representation */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4">
          <div className="relative w-72 sm:w-80 h-96 flex items-center justify-center">
            
            {/* Ultrasonic Sensor Transducer Housing mounted at top */}
            <div className="absolute top-0 z-20 flex flex-col items-center">
              <div className="bg-slate-700 border border-slate-600 px-3 py-1 rounded-t-md text-[10px] font-mono text-slate-300 shadow">
                HC-SR04 / JSN-SR04T
              </div>
              <div className="w-16 h-4 bg-slate-800 border-x border-b border-slate-600 flex justify-around items-center px-1">
                <div className="w-3 h-3 rounded-full bg-slate-950 border border-teal-400 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-teal-400 animate-ping"></span>
                </div>
                <div className="w-3 h-3 rounded-full bg-slate-950 border border-teal-400"></div>
              </div>

              {/* Pulsing Ultrasonic Echo Waves (Only when hardware is actively transmitting) */}
              {hasData && (
                <div className="flex flex-col items-center space-y-1 mt-1">
                  <div className="w-6 h-1 border-b-2 border-teal-400/80 rounded-full animate-pulse"></div>
                  <div className="w-10 h-1 border-b-2 border-teal-400/60 rounded-full animate-pulse delay-100"></div>
                  <div className="w-14 h-1 border-b-2 border-teal-400/40 rounded-full animate-pulse delay-200"></div>
                </div>
              )}
            </div>

            {/* Physical Cylindrical Tank Wall Frame */}
            <div className={`relative w-64 h-80 rounded-3xl border-4 ${
              hasData ? 'border-slate-700 bg-slate-950/70 shadow-2xl' : 'border-dashed border-slate-700/60 bg-slate-950/40'
            } overflow-hidden flex flex-col justify-end`}>
              
              {/* Measurement Rulers / Graduation lines */}
              <div className="absolute inset-y-4 right-2 z-20 flex flex-col justify-between text-[10px] font-mono text-slate-500 pointer-events-none select-none">
                <span className="flex items-center space-x-1"><span>100%</span><span className="w-2 h-0.5 bg-slate-600"></span></span>
                <span className="flex items-center space-x-1"><span>75%</span><span className="w-1.5 h-0.5 bg-slate-600"></span></span>
                <span className="flex items-center space-x-1"><span>50%</span><span className="w-2 h-0.5 bg-slate-600"></span></span>
                <span className="flex items-center space-x-1"><span>25%</span><span className="w-1.5 h-0.5 bg-slate-600"></span></span>
                <span className="flex items-center space-x-1"><span>0%</span><span className="w-2 h-0.5 bg-slate-600"></span></span>
              </div>

              {/* Inflow Pipe on top left */}
              <div className="absolute top-6 -left-3 w-6 h-3 bg-slate-800 border border-slate-600 rounded-r-none"></div>

              {/* Outflow Drinking Water Valve at bottom left */}
              <div className="absolute bottom-6 -left-3 w-6 h-3 bg-slate-800 border border-slate-600 rounded-r-none"></div>

              {/* Water Fill Column */}
              {hasData && waterLevelPct !== null ? (
                <div
                  className="w-full relative transition-all duration-1000 ease-out"
                  style={{ height: `${Math.max(2, Math.min(100, waterLevelPct))}%` }}
                >
                  {/* Water Surface Wave Line */}
                  <div
                    className="absolute -top-2 inset-x-0 h-4 rounded-full opacity-80"
                    style={{
                      backgroundColor: waterSurfaceColor,
                      filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))'
                    }}
                  />

                  {/* Liquid Body */}
                  <div className={`w-full h-full bg-gradient-to-t ${waterColorClass} backdrop-blur-sm relative overflow-hidden`}>
                    {/* Interior Bubbles/Subsurface highlights */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  </div>
                </div>
              ) : (
                /* Hardware Not Connected / No Data Blueprint Placeholder */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                    <WifiOff className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Waiting for Sensor Data</p>
                  <p className="text-xs text-slate-600 mt-1">Connect physical ESP32 to visualize real water column</p>
                </div>
              )}
            </div>

            {/* Physical Tank Base Pedestal */}
            <div className="absolute bottom-1 w-72 h-4 bg-slate-800 border border-slate-700 rounded-t-lg shadow-lg"></div>
          </div>
        </div>

        {/* Right Column: Telemetry Digital Telemetry Matrix */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Level Metric Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-teal-400" />
                <span>Water Storage Level</span>
              </span>
              <span className="font-mono text-slate-500">Cap: {tankCapacity} L</span>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                {hasData && waterLevelPct !== null ? `${waterLevelPct}%` : '--'}
              </span>
              <span className="text-sm font-medium text-slate-400">
                {hasData && waterLitres !== null ? `(${waterLitres} Litres)` : '(No Data)'}
              </span>
            </div>

            {/* Status Condition Badge */}
            <div className="mt-3">
              {hasData ? (
                <div className="flex items-center space-x-2">
                  {ultrasonicStatus === 'NORMAL' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Level Normal</span>
                    </span>
                  )}
                  {ultrasonicStatus === 'LOW' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Low Reserve Condition</span>
                    </span>
                  )}
                  {ultrasonicStatus === 'OVERFLOW' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Overflow Warning</span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No sensor telemetry available</span>
              )}
            </div>
          </div>

          {/* Sensor Diagnostics Sub-Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ultrasonic Distance */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <p className="text-[11px] font-medium text-slate-400">Air Gap / Distance</p>
              <p className="text-lg font-bold font-mono text-slate-200 mt-1">
                {hasData && distanceCm !== null ? `${distanceCm} cm` : '--'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sensor to water surface</p>
            </div>

            {/* Drinking Water Turbidity */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <p className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>Turbidity</span>
              </p>
              <p className="text-lg font-bold font-mono text-slate-200 mt-1">
                {hasData && turbidityNtu !== null ? `${turbidityNtu} NTU` : '--'}
              </p>
              <p className={`text-[10px] font-medium mt-0.5 ${
                turbidityStatus === 'GOOD' ? 'text-emerald-400' :
                turbidityStatus === 'MODERATE' ? 'text-amber-400' :
                turbidityStatus === 'POOR' ? 'text-rose-400' : 'text-slate-500'
              }`}>
                {hasData ? `Quality: ${turbidityStatus}` : 'Disconnected'}
              </p>
            </div>
          </div>

          {/* Last Sensor Ping Footer */}
          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Telemetry Update:</span>
            </span>
            <span className="font-mono text-slate-300">
              {hasData && (lastUpdate || sensorData?.recorded_at)
                ? new Date(lastUpdate || sensorData.recorded_at).toLocaleTimeString()
                : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
