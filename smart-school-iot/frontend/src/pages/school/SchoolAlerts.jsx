import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const SchoolAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await schoolService.getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
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
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Institution Alerts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real hardware alerts generated for your registered school
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-xs text-slate-500 italic">
          <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No Alerts Active</p>
          <p className="text-slate-500 mt-1">Water level, drinking water turbidity, and kitchen humidity are within configured normal limits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono uppercase">
                    {a.alert_type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-200 font-medium">{a.message}</p>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                a.status === 'ACTIVE' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
