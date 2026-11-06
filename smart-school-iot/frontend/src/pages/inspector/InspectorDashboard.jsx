import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectorService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import {
  Building2,
  Droplets,
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  X,
  Flag,
  UserCheck
} from 'lucide-react';

export const InspectorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await inspectorService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleReview = async (imageId, status) => {
    setReviewLoading(true);
    setActionSuccess('');
    try {
      await inspectorService.reviewImage(imageId, status, reviewNotes || `Verified by Field Inspector`);
      setActionSuccess(`Image submission #${imageId} successfully marked as ${status}!`);
      setReviewingId(null);
      setReviewNotes('');
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const { stats, schools_overview, recent_alerts, recent_images } = data || {
    stats: {},
    schools_overview: [],
    recent_alerts: [],
    recent_images: []
  };

  const pendingImages = recent_images.filter((img) =>
    ['PENDING_REVIEW', 'CV_PASS', 'CV_FLAG'].includes(img.status)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Field Inspector Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervise assigned government institutions, monitor overhead tank telemetry, and audit daily mid-day meals
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Schools</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.total_assigned_schools || 0}</p>
          <span className="text-[11px] text-teal-400 font-medium">Under Supervision</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ESP32 Online</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.hardware_connected || 0}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Transmitting Nodes</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Today</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.verified_today || 0}</p>
          <span className="text-[11px] text-cyan-400 font-medium">Schools Compliant</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Audit</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.pending_meal_reviews || 0}</p>
          <span className="text-[11px] text-amber-400 font-medium">Meal Submissions</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Alarms</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.active_alerts || 0}</p>
          <span className="text-[11px] text-rose-400 font-medium">Requires Attention</span>
        </div>
      </div>

      {/* Assigned Institutions Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>Assigned Government Schools ({schools_overview.length})</span>
          </h2>
          <Link to="/inspector/schools" className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {schools_overview.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">No Schools Assigned to Your Account Yet</p>
            <p className="text-xs text-slate-500 mt-1">
              The Central State Administrator will assign specific government schools to your inspection jurisdiction.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools_overview.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.name}</h3>
                    <p className="text-[10px] font-mono text-teal-400 mt-0.5">{s.school_code}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.district}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    s.hardware_status === 'CONNECTED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {s.hardware_label}
                  </span>
                </div>

                {/* Telemetry info */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Water Tank Fill:</span>
                    <span className="font-bold text-white">
                      {s.latest_reading?.water_level_pct !== null && s.latest_reading?.water_level_pct !== undefined
                        ? `${s.latest_reading.water_level_pct}% (${s.latest_reading.water_volume_litres} L)`
                        : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Turbidity:</span>
                    <span className="font-semibold text-white">
                      {s.latest_reading?.turbidity_ntu !== null && s.latest_reading?.turbidity_ntu !== undefined
                        ? `${s.latest_reading.turbidity_ntu} NTU`
                        : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Today's Meal:</span>
                    <span className={`font-semibold ${
                      s.verification_status === 'VERIFIED'
                        ? 'text-emerald-400'
                        : s.verification_status === 'PENDING_REVIEW'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}>
                      {s.verification_status === 'VERIFIED'
                        ? 'VERIFIED'
                        : s.verification_status === 'PENDING_REVIEW'
                        ? 'Awaiting Review'
                        : 'No Upload Today'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Principal: {s.principal_name}</span>
                  <Link
                    to={`/inspector/digital-twin?school_id=${s.id}`}
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1"
                  >
                    <span>View Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mid-Day Meal Pending Review Desk */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            <span>Inspection Action Desk: Submissions Awaiting Audit ({pendingImages.length})</span>
          </h2>
          <Link to="/inspector/meals" className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center space-x-1">
            <span>Full Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingImages.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
            All meal & kitchen hygiene photo submissions from your assigned schools are verified!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingImages.slice(0, 6).map((img) => (
              <div
                key={img.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950">
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={img.meal_type || 'Meal'}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/70 backdrop-blur-md text-white uppercase">
                      {img.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{img.school_name}</h4>
                    <p className="text-[11px] text-teal-400 font-medium truncate">{img.meal_type || 'Mid-Day Meal'}</p>
                    <p className="text-[10px] text-slate-400 truncate">Menu: {img.menu_description || 'Daily Meal'}</p>
                  </div>

                  {/* CV analysis snippet */}
                  {img.cv_notes && (
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                      <span className="text-teal-400 font-bold block">AI / CV Insight:</span>
                      <span className="text-slate-400">{img.cv_notes}</span>
                    </div>
                  )}
                </div>

                {/* Verification Actions */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {reviewingId === img.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Add review notes (optional)..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                      <div className="flex space-x-1.5">
                        <button
                          disabled={reviewLoading}
                          onClick={() => handleReview(img.id, 'VERIFIED')}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-600"
                        >
                          Verify
                        </button>
                        <button
                          disabled={reviewLoading}
                          onClick={() => handleReview(img.id, 'FLAGGED')}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600"
                        >
                          Flag
                        </button>
                        <button
                          onClick={() => setReviewingId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReview(img.id, 'VERIFIED')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Verify</span>
                      </button>
                      <button
                        onClick={() => setReviewingId(img.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
