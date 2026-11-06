import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  LogOut
} from 'lucide-react';

export const InspectorProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const assignedSchools = user?.assigned_schools || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">Inspector Profile & Jurisdiction</h1>
        <p className="text-xs text-slate-400 mt-1">
          Authorized Field Inspector credentials and assigned government school institutions
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xl">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {user?.status}
              </span>
            </div>
            <p className="text-xs text-teal-400 font-medium">{user?.district || 'Field Inspector Jurisdiction'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Email Address</span>
              <span className="text-slate-200 font-semibold">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Access Role</span>
              <span className="text-slate-200 font-semibold">Field Inspector (MEO / Supervisor)</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned District</span>
              <span className="text-slate-200 font-semibold">{user?.district || 'State Jurisdiction'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Schools Under Supervision</span>
              <span className="text-slate-200 font-semibold">{assignedSchools.length} Institutions Assigned</span>
            </div>
          </div>
        </div>

        {/* Assigned Schools Preview */}
        {assignedSchools.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Assigned Institutions ({assignedSchools.length}):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {assignedSchools.map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{s.name}</span>
                  <span className="text-[10px] font-mono text-teal-400">{s.school_code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
