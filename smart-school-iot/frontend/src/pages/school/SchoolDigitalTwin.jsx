import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import { WaterTankDigitalTwin } from '../../components/WaterTankDigitalTwin';
import { RefreshCw } from 'lucide-react';

export const SchoolDigitalTwin = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTwin = async () => {
    try {
      const res = await schoolService.getDigitalTwin();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTwin();
    const interval = setInterval(fetchTwin, 5000);
    return () => clearInterval(interval);
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Water Tank Digital Twin</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cyber-physical model of your institution's drinking water storage tank
          </p>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchTwin(); }}
          disabled={refreshing}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
        </button>
      </div>

      {/* Strictly isolated tank digital twin (NO school selector) */}
      <WaterTankDigitalTwin
        schoolName={data?.school_name}
        tankCapacity={data?.tank_capacity_litres}
        tankHeight={data?.tank_height_cm}
        sensorData={data?.sensor_data}
        hardwareStatus={data?.hardware_status}
        hardwareLabel={data?.hardware_label}
        lastUpdate={data?.last_sensor_update}
      />
    </div>
  );
};
