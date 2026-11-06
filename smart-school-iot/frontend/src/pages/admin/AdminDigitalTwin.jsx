import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { WaterTankDigitalTwin } from '../../components/WaterTankDigitalTwin';
import { Building2, RefreshCw } from 'lucide-react';

export const AdminDigitalTwin = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTwin = async (schoolId) => {
    try {
      const res = await adminService.getDigitalTwin(schoolId);
      setSchools(res.data.schools || []);
      setTwinData(res.data);
      if (!selectedSchoolId && res.data.selected_school) {
        setSelectedSchoolId(res.data.selected_school.id);
      }
    } catch (err) {
      console.error("Error loading Digital Twin:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTwin(selectedSchoolId);
    const interval = setInterval(() => {
      fetchTwin(selectedSchoolId);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSchoolId]);

  const handleSchoolChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedSchoolId(id);
    setLoading(true);
    fetchTwin(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const school = twinData?.selected_school;
  const sensor = twinData?.sensor_data;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Water Tank Digital Twin</h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical simulation of water tank dynamics driven by real ESP32 ultrasonic and turbidity telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* School Selector (Admin Only) */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Building2 className="w-4 h-4 text-teal-400" />
            <select
              value={selectedSchoolId || ''}
              onChange={handleSchoolChange}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.school_code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setRefreshing(true); fetchTwin(selectedSchoolId); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Digital Twin Visualizer */}
      <WaterTankDigitalTwin
        schoolName={school?.name || 'ZPHS Poranki'}
        tankCapacity={school?.tank_capacity_litres || 2000}
        tankHeight={school?.tank_height_cm || 200}
        sensorData={sensor}
        hardwareStatus={school?.hardware_status || 'DISCONNECTED'}
        hardwareLabel={school?.hardware_label || 'Hardware Not Connected'}
        lastUpdate={school?.last_hardware_ping}
      />
    </div>
  );
};
