import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Cpu,
  Key,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export const SchoolProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await schoolService.getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">Institution Profile & Credentials</h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered school details and ESP32 hardware node authentication
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xl">
            SCH
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{profile?.school_name}</h2>
            <p className="text-xs text-teal-400 font-mono font-semibold">School ID: {profile?.school_code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-slate-500 font-medium block">Headmaster / Principal</span>
            <strong className="text-slate-200 text-sm block">{profile?.principal_name}</strong>
            <p className="text-slate-400 flex items-center space-x-1.5 pt-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{profile?.email}</span>
            </p>
            <p className="text-slate-400 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{profile?.phone}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-slate-500 font-medium block">Location & Address</span>
            <strong className="text-slate-200 text-sm block">{profile?.district}, {profile?.state}</strong>
            <p className="text-slate-400 flex items-start space-x-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{profile?.address}</span>
            </p>
          </div>
        </div>

        {/* ESP32 Hardware Credentials Box */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4" />
            <span>ESP32 Hardware Node Configuration</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Device Identifier:</span>
              <strong className="text-white font-mono">{profile?.hardware_device_id}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">API Secret Token:</span>
              <strong className="text-teal-400 font-mono">{profile?.hardware_api_key}</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Ensure this exact API Key is programmed into your ESP32's <code className="text-teal-400">config.h</code> file before deploying physical hardware.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/25 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of School Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
