import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inspectorService } from '../../services/api';
import { WaterTankDigitalTwin } from '../../components/WaterTankDigitalTwin';
import { Building2, RefreshCw } from 'lucide-react';

export const InspectorDigitalTwin = () => {
  const [searchParams] = useSearchParams();
  const schoolIdParam = searchParams.get('school_id');

  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolIdParam ? parseInt(schoolIdParam) : null);
  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTwin = async (schoolId) => {
    try {
      const res = await inspectorService.getDigitalTwin(schoolId);
      setSchools(res.data.schools || []);
      setTwinData(res.data);
      if (!selectedSchoolId && res.data.selected_school) {
        setSelectedSchoolId(res.data.selected_school.id);
      }
    } catch (err) {
      console.error("Error loading Inspector Digital Twin:", err);
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
            Real-time physical tank digital twin simulation across your assigned government schools
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {schools.length > 0 && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-teal-400" />
              <select
                value={selectedSchoolId || ''}
                onChange={handleSchoolChange}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name} ({s.school_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => { setRefreshing(true); fetchTwin(selectedSchoolId); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {schools.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No Schools Assigned Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Once the Central State Administrator assigns government schools to your profile, their water tank digital twins will be active here.
          </p>
        </div>
      ) : (
        <WaterTankDigitalTwin
          schoolName={school?.name}
          tankCapacity={school?.tank_capacity_litres}
          tankHeight={school?.tank_height_cm}
          sensorData={sensor}
          hardwareStatus={school?.hardware_status}
          hardwareLabel={school?.hardware_label}
          lastUpdate={school?.last_hardware_ping}
        />
      )}
    </div>
  );
};
