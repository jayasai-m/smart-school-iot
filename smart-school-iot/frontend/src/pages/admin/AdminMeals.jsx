import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  UtensilsCrossed,
  Check,
  AlertTriangle,
  XCircle,
  Eye,
  Building2,
  RefreshCw,
  Filter,
  Users,
  Brain
} from 'lucide-react';

export const AdminMeals = () => {
  const [data, setData] = useState({ schools: [], images: [], meals: [] });
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchMeals = async () => {
    try {
      const params = {};
      if (selectedSchoolId) params.school_id = selectedSchoolId;
      if (statusFilter) params.status_filter = statusFilter;
      const res = await adminService.getMeals(params);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching meals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeals(); }, [selectedSchoolId, statusFilter]);

  const handleReview = async (imageId, newStatus) => {
    setIsReviewing(true);
    try {
      await adminService.reviewImage(imageId, newStatus, reviewNotes);
      setSelectedImage(null);
      setReviewNotes('');
      fetchMeals();
    } catch (err) {
      console.error('Review action error:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'MEAL_PREPARATION') return '🥘 Meal Prep';
    if (cat === 'KITCHEN_HYGIENE')  return '🧼 Kitchen Hygiene';
    if (cat === 'STUDENT_EATING')   return '👥 Students Eating';
    return cat;
  };

  const statusPill = (status) => {
    const map = {
      VERIFIED:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      CV_PASS:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      FLAGGED:        'bg-amber-500/20 text-amber-300 border-amber-500/40',
      CV_FLAG:        'bg-rose-500/20 text-rose-300 border-rose-500/40',
      REJECTED:       'bg-rose-500/20 text-rose-300 border-rose-500/40',
      PENDING_REVIEW: 'bg-slate-800/90 text-slate-300 border-slate-700',
    };
    return map[status] || 'bg-slate-800/90 text-slate-300 border-slate-700';
  };

  const cardBorder = (img) => {
    if (img.status === 'CV_FLAG' || img.status === 'FLAGGED') return 'border-rose-500/40';
    if (img.status === 'CV_PASS' || img.status === 'VERIFIED') return 'border-emerald-500/30';
    return 'border-slate-800 hover:border-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  const { schools, images } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mid-Day Meal &amp; Kitchen Hygiene</h1>
          <p className="text-xs text-slate-400 mt-1">
            CV-assisted photo verification • Food quality check • Student count • Manual admin review
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* School filter */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-teal-400" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-teal-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value=""              className="bg-slate-900">All Statuses</option>
              <option value="PENDING_REVIEW" className="bg-slate-900">Pending Review</option>
              <option value="CV_PASS"        className="bg-slate-900">🤖 CV: Passed</option>
              <option value="CV_FLAG"        className="bg-slate-900">🤖 CV: Flagged</option>
              <option value="VERIFIED"       className="bg-slate-900">Admin Verified</option>
              <option value="FLAGGED"        className="bg-slate-900">Admin Flagged</option>
              <option value="REJECTED"       className="bg-slate-900">Rejected</option>
            </select>
          </div>

          <button
            onClick={fetchMeals}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <UtensilsCrossed className="w-4 h-4 text-teal-400" />
            <span>Staff Image Submissions ({images.length})</span>
          </h2>
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>CV auto-analysis active for Meal Prep &amp; Student Eating</span>
          </span>
        </div>

        {images.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500 italic">
            No Submissions Yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.map((img) => (
              <div
                key={img.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-colors ${cardBorder(img)}`}
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-slate-950 overflow-hidden group">
                    <img
                      src={img.image_url}
                      alt="Submission"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => { setSelectedImage(img); setReviewNotes(img.admin_notes || ''); }}
                        className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" /><span>Inspect Full Photo</span>
                      </button>
                    </div>

                    {/* Category badge */}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/90 backdrop-blur-sm text-teal-300 border border-teal-500/30">
                      {getCategoryLabel(img.category)}
                    </span>

                    {/* Status pill */}
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusPill(img.status)}`}>
                      {img.status}
                    </span>

                    {/* Student count badge */}
                    {img.category === 'STUDENT_EATING' && img.cv_student_count != null && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-600/90 text-white border border-violet-400/40 flex items-center space-x-1 shadow-md">
                        <Users className="w-3.5 h-3.5" />
                        <span>~{img.cv_student_count} students</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm truncate">{img.school_name || 'School'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(img.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {img.meal_type && <p className="text-teal-400 font-medium">Menu: {img.meal_type}</p>}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>Staff: <span className="text-slate-200 font-medium">{img.staff_name || '--'}</span></div>
                      <div>Shift: <span className="text-slate-200 font-medium">{img.inspection_shift || '--'}</span></div>
                    </div>

                    {/* CV inline note */}
                    {img.cv_notes && (
                      <div className={`mt-1.5 px-2.5 py-2 rounded-lg border text-[11px] ${
                        img.cv_status === 'CV_PASS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                        img.cv_status === 'CV_FLAG' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                        'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        <span className="font-semibold">🤖 CV: </span>{img.cv_notes}
                      </div>
                    )}

                    {img.admin_notes && (
                      <p className="text-[11px] text-teal-300 bg-teal-500/10 p-2 rounded-lg border border-teal-500/20">
                        Admin Note: {img.admin_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => { setSelectedImage(img); setReviewNotes(img.admin_notes || ''); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => handleReview(img.id, 'VERIFIED')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" /><span>Verify</span>
                  </button>
                  <button
                    onClick={() => handleReview(img.id, 'FLAGGED')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /><span>Flag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-6">
            {/* Modal header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Image Inspection #{selectedImage.id}</h3>
                <p className="text-xs text-slate-400">{selectedImage.school_name} • {getCategoryLabel(selectedImage.category)}</p>
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-white p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Full image */}
              <div className="max-h-80 overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                <img
                  src={selectedImage.image_url}
                  alt="Full Resolution"
                  className="max-h-80 w-auto object-contain"
                />
              </div>

              {/* ── CV Analysis Panel ── */}
              {selectedImage.cv_status ? (
                <div className={`rounded-xl border p-4 space-y-3 ${
                  selectedImage.cv_status === 'CV_PASS' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  selectedImage.cv_status === 'CV_FLAG' ? 'bg-rose-500/10 border-rose-500/30' :
                  'bg-slate-800/50 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Brain className="w-4 h-4 text-violet-400" />
                      <span>Computer Vision Analysis Result</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusPill(selectedImage.cv_status)}`}>
                      {selectedImage.cv_status}
                    </span>
                  </div>

                  {selectedImage.cv_notes && (
                    <p className="text-xs text-slate-200 leading-relaxed">{selectedImage.cv_notes}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-[11px]">
                    {selectedImage.cv_confidence != null && (
                      <div className="bg-slate-900/60 rounded-lg px-3 py-2 text-center min-w-[80px]">
                        <p className="text-slate-500">Confidence</p>
                        <p className="font-bold text-white">{Math.round(selectedImage.cv_confidence * 100)}%</p>
                      </div>
                    )}
                    {selectedImage.cv_student_count != null && (
                      <div className="bg-violet-500/15 rounded-lg px-3 py-2 text-center border border-violet-500/30 min-w-[80px]">
                        <p className="text-violet-400">Students Detected</p>
                        <p className="font-bold text-white text-lg">~{selectedImage.cv_student_count}</p>
                      </div>
                    )}
                    {selectedImage.cv_processed_at && (
                      <div className="bg-slate-900/60 rounded-lg px-3 py-2 text-center min-w-[80px]">
                        <p className="text-slate-500">CV Time</p>
                        <p className="font-bold text-slate-300">
                          {new Date(selectedImage.cv_processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedImage.category !== 'KITCHEN_HYGIENE' && (
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-400 flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-slate-500" />
                  <span>CV analysis is still processing — refresh in a few seconds, or add your Gemini API key in <code className="text-teal-400">.env</code></span>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg">
                  <div><span className="text-slate-500">Menu / Item:</span> <strong className="text-slate-200">{selectedImage.meal_type || 'N/A'}</strong></div>
                  <div><span className="text-slate-500">Staff:</span> <strong className="text-slate-200">{selectedImage.staff_name || 'N/A'}</strong></div>
                  <div><span className="text-slate-500">Shift:</span> <strong className="text-slate-200">{selectedImage.inspection_shift || 'N/A'}</strong></div>
                  <div><span className="text-slate-500">Status:</span> <strong className="text-teal-400">{selectedImage.status}</strong></div>
                </div>

                {selectedImage.captured_location && (
                  <p className="p-3 bg-slate-950 rounded-lg text-slate-300 text-[11px]">
                    <span className="text-slate-500">📍 GPS Location:</span> {selectedImage.captured_location}
                  </p>
                )}
                {selectedImage.captured_timestamp && (
                  <p className="p-3 bg-slate-950 rounded-lg text-slate-300 text-[11px]">
                    <span className="text-slate-500">🕒 Capture Time:</span> {selectedImage.captured_timestamp}
                  </p>
                )}
                {selectedImage.hygiene_notes && (
                  <p className="p-3 bg-slate-950 rounded-lg text-slate-300">
                    <span className="text-slate-500">Hygiene Notes:</span> {selectedImage.hygiene_notes}
                  </p>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Administrator Verification Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter compliance or deficiency observation notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Review buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'REJECTED')}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  Reject Photo
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'FLAGGED')}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  Flag for Inspection
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'VERIFIED')}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Verify &amp; Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
