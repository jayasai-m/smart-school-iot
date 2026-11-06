import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { WaterTankDigitalTwin } from '../../components/WaterTankDigitalTwin';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Key,
  Cpu,
  AlertTriangle,
  UtensilsCrossed,
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const AdminSchoolDetails = () => {
  const { schoolId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      const res = await adminService.getSchoolDetails(schoolId);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const { school, hardware, latest_reading, alerts, meals, images } = data;

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/schools"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{school.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Code: <span className="text-teal-400 font-mono">{school.school_code}</span> • District: {school.district}
            </p>
          </div>
        </div>

        <button
          onClick={fetchDetails}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* School Contact & Hardware Integration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Institution Contacts</h3>
          <div className="space-y-2 text-xs text-slate-300">
            <p className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Principal: <strong>{school.principal_name}</strong></span>
            </p>
            <p className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Email: <strong>{school.email}</strong></span>
            </p>
            <p className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Phone: <strong>{school.phone}</strong></span>
            </p>
            <p className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>Address: {school.address}</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">ESP32 Hardware Credentials</h3>
          <div className="space-y-2 text-xs text-slate-300">
            <p className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Device ID: <strong className="font-mono text-white">{school.hardware_device_id}</strong></span>
            </p>
            <p className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-slate-500 shrink-0" />
              <span>API Key: <strong className="font-mono text-teal-400">{school.hardware_api_key}</strong></span>
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              Flash this Device ID and API Key into the physical ESP32 firmware config.h to bind telemetry to this school.
            </p>
          </div>
        </div>
      </div>

      {/* Digital Twin Widget for This School */}
      <WaterTankDigitalTwin
        schoolName={school.name}
        tankCapacity={school.tank_capacity_litres}
        tankHeight={school.tank_height_cm}
        sensorData={latest_reading}
        hardwareStatus={hardware.status}
        hardwareLabel={hardware.label}
        lastUpdate={school.last_hardware_ping}
      />
    </div>
  );
};
