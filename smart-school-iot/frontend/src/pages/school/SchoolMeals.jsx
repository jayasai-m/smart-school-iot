import React, { useEffect, useState } from 'react';
import { schoolService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import { StaffUploadModal } from '../../components/StaffUploadModal';
import {
  UtensilsCrossed,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Camera,
  Check
} from 'lucide-react';

export const SchoolMeals = () => {
  const [data, setData] = useState({ meals: [], images: [], latest_sensor: null });
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Quick Meal Form state
  const [mealForm, setMealForm] = useState({
    meal_type: '',
    menu_description: '',
    staff_name: '',
    inspection_shift: 'Morning Prep',
    hygiene_notes: ''
  });
  const [isSubmittingMeal, setIsSubmittingMeal] = useState(false);
  const [mealSuccess, setMealSuccess] = useState(false);

  const fetchMeals = async () => {
    try {
      const res = await schoolService.getMeals();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
    const handleUploaded = () => fetchMeals();
    window.addEventListener('meal_uploaded', handleUploaded);
    return () => window.removeEventListener('meal_uploaded', handleUploaded);
  }, []);

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    if (!mealForm.meal_type || !mealForm.staff_name) return;
    setIsSubmittingMeal(true);
    try {
      await schoolService.submitMeal(mealForm);
      setMealSuccess(true);
      setMealForm({
        meal_type: '',
        menu_description: '',
        staff_name: '',
        inspection_shift: 'Morning Prep',
        hygiene_notes: ''
      });
      fetchMeals();
      setTimeout(() => setMealSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMeal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const { meals, images, latest_sensor } = data;
  const filteredImages = categoryFilter === 'ALL' ? images : images.filter((img) => img.category === categoryFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mid-Day Meal & Kitchen Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit daily meal preparation details and upload inspection photos for state review
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20"
        >
          <Camera className="w-4 h-4" />
          <span>+ Upload Inspection Photo</span>
        </button>
      </div>

      {/* Grid: Meal Form & Kitchen Environmental Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meal Submission Form */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5 text-teal-400" />
              <span>Log Daily Mid-Day Meal Menu</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleDateString()}</span>
          </div>

          {mealSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Meal record submitted successfully!</span>
            </div>
          )}

          <form onSubmit={handleMealSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Meal Type / Main Dish *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sambar Rice & Boiled Egg"
                  value={mealForm.meal_type}
                  onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Inspection Shift *</label>
                <select
                  value={mealForm.inspection_shift}
                  onChange={(e) => setMealForm({ ...mealForm, inspection_shift: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500"
                >
                  <option value="Morning Prep">Morning Prep (8:00 AM - 11:00 AM)</option>
                  <option value="Lunch Serving">Lunch Serving (12:00 PM - 2:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Cook / Staff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Lakshmi Devi"
                  value={mealForm.staff_name}
                  onChange={(e) => setMealForm({ ...mealForm, staff_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Menu Description</label>
                <input
                  type="text"
                  placeholder="Ingredients, pulses, seasonal vegetables"
                  value={mealForm.menu_description}
                  onChange={(e) => setMealForm({ ...mealForm, menu_description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Hygiene & Cooking Notes</label>
              <textarea
                rows={2}
                placeholder="Sanitation observed, filtered water used for cooking, cleanliness checked."
                value={mealForm.hygiene_notes}
                onChange={(e) => setMealForm({ ...mealForm, hygiene_notes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500 placeholder-slate-600 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmittingMeal}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20"
              >
                {isSubmittingMeal ? 'Submitting...' : 'Register Meal Entry'}
              </button>
            </div>
          </form>
        </div>

        {/* Real Kitchen Humidity Diagnostics */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Kitchen Environment Sensor</h3>
          
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Relative Humidity</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">
              {latest_sensor && latest_sensor.humidity_pct !== undefined
                ? `${latest_sensor.humidity_pct}%`
                : '--'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {latest_sensor ? `Status: ${latest_sensor.humidity_status}` : 'Waiting for Sensor Data'}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Strictly driven by physical DHT sensor deployed in the school kitchen. Temperature is only displayed if physically reported by the hardware.
          </p>
        </div>
      </div>

      {/* Uploaded Photo Submissions & Status Tracking */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-teal-400" />
            <span>Uploaded Inspection Photos ({images.length})</span>
          </h2>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            {[
              { id: 'ALL', label: 'All Photos' },
              { id: 'MEAL_PREPARATION', label: '🥘 Meal Prep' },
              { id: 'KITCHEN_HYGIENE', label: '🧼 Kitchen Hygiene' },
              { id: 'STUDENT_EATING', label: '👥 Students Eating' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  categoryFilter === tab.id
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredImages.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500 italic">
            No Submissions Yet in this category. Use the upload button above to submit photos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredImages.map((img) => {
              const categoryLabel =
                img.category === 'MEAL_PREPARATION' ? '🥘 Meal Prep' :
                img.category === 'STUDENT_EATING' ? '👥 Students Eating' :
                '🧼 Kitchen Hygiene';

              const statusColor =
                img.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                img.status === 'CV_PASS'  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                img.status === 'FLAGGED'  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                img.status === 'CV_FLAG'  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                img.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div key={img.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div>
                    <div className="relative h-44 bg-slate-950">
                      <img
                        src={getImageUrl(img.image_url)}
                        alt="Meal Inspection"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/90 text-teal-300 border border-teal-500/30">
                        {categoryLabel}
                      </span>

                      {/* Status Pill */}
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {img.status}
                      </span>

                      {/* Student Count Badge for Students Eating */}
                      {img.category === 'STUDENT_EATING' && img.cv_student_count != null && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-600/90 text-white border border-violet-400/40 shadow-md">
                          👥 ~{img.cv_student_count} students
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5 text-xs">
                      <p className="font-bold text-white text-sm">{img.meal_type || 'Photo Inspection'}</p>
                      <p className="text-slate-400 text-[11px]">Staff: {img.staff_name || 'Staff'} • {img.inspection_shift}</p>

                      {/* CV result display */}
                      {img.cv_notes && (
                        <div className={`mt-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] ${
                          img.cv_status === 'CV_PASS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                          img.cv_status === 'CV_FLAG' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                          'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}>
                          <span className="font-semibold">🤖 CV: </span>{img.cv_notes}
                        </div>
                      )}

                      {img.hygiene_notes && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800">
                          "{img.hygiene_notes}"
                        </p>
                      )}
                      {img.admin_notes && (
                        <p className="text-[11px] text-teal-300 bg-teal-500/10 p-2 rounded border border-teal-500/20">
                          Admin Note: {img.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 font-mono">
                    Submitted: {new Date(img.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StaffUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        schoolName="ZPHS Penamaluru"
        onUploadSuccess={fetchMeals}
      />
    </div>
  );
};
