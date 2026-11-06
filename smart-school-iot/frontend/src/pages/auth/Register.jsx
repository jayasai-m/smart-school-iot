import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { Building2, UserCheck, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [roleType, setRoleType] = useState('SCHOOL'); // 'SCHOOL' or 'INSPECTOR'

  // School form state
  const [schoolData, setSchoolData] = useState({
    school_name: '',
    school_code: '',
    district: '',
    state: 'Andhra Pradesh',
    address: '',
    principal_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });

  // Inspector form state
  const [inspectorData, setInspectorData] = useState({
    full_name: '',
    email: '',
    phone: '',
    district: '',
    password: '',
    confirm_password: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchoolChange = (e) => {
    setSchoolData({
      ...schoolData,
      [e.target.name]: e.target.value
    });
  };

  const handleInspectorChange = (e) => {
    setInspectorData({
      ...inspectorData,
      [e.target.name]: e.target.value
    });
  };

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (schoolData.password !== schoolData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (schoolData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register(schoolData);
      navigate('/pending-approval');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit school registration. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInspectorSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (inspectorData.password !== inspectorData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (inspectorData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.registerInspector(inspectorData);
      navigate('/pending-approval');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit inspector registration. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-xl shadow-teal-500/20 border border-teal-400/30">
            {roleType === 'SCHOOL' ? (
              <Building2 className="w-8 h-8 text-white" />
            ) : (
              <UserCheck className="w-8 h-8 text-white" />
            )}
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          {roleType === 'SCHOOL' ? 'Government School Onboarding' : 'Field Inspector Registration'}
        </h2>
        <p className="mt-1 text-center text-xs text-teal-400 font-medium uppercase tracking-wider">
          SmartSchoolIoT Registration & State Nodal Verification
        </p>

        {/* Role Type Selector Tabs */}
        <div className="mt-6 flex justify-center">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex space-x-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setRoleType('SCHOOL'); setErrorMsg(''); }}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roleType === 'SCHOOL'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>School Registration</span>
            </button>
            <button
              type="button"
              onClick={() => { setRoleType('INSPECTOR'); setErrorMsg(''); }}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roleType === 'INSPECTOR'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Field Inspector (MEO)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mb-6 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400" />
            <span>
              All newly registered {roleType === 'SCHOOL' ? 'institutions' : 'inspectors'} remain in <strong>PENDING APPROVAL</strong> status until approved by the State Administrator.
            </span>
          </div>

          {/* Form for SCHOOL */}
          {roleType === 'SCHOOL' ? (
            <form onSubmit={handleSchoolSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    School Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="school_name"
                    placeholder="e.g. ZPHS Kankipadu"
                    value={schoolData.school_name}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    School ID / U-DISE Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="school_code"
                    placeholder="e.g. SCH-KANKIPADU-002"
                    value={schoolData.school_code}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    District <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="district"
                    placeholder="e.g. Krishna"
                    value={schoolData.district}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="state"
                    value={schoolData.state}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Complete School Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  name="address"
                  placeholder="Village / Mandal, Pincode"
                  value={schoolData.address}
                  onChange={handleSchoolChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Principal / Headmaster Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="principal_name"
                    placeholder="e.g. K. Venkata Rao"
                    value={schoolData.principal_name}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Phone / Mobile <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="phone"
                    placeholder="+91 9876543210"
                    value={schoolData.phone}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Institutional Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    placeholder="school@gmail.com"
                    value={schoolData.email}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    placeholder="Min 6 characters"
                    value={schoolData.password}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="confirm_password"
                    placeholder="Re-enter password"
                    value={schoolData.confirm_password}
                    onChange={handleSchoolChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Submit School Registration</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Form for INSPECTOR */
            <form onSubmit={handleInspectorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name & Designation <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="full_name"
                  placeholder="e.g. S. Srinivas Rao (Mandal Educational Officer)"
                  value={inspectorData.full_name}
                  onChange={handleInspectorChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    placeholder="inspector.meo@gmail.com"
                    value={inspectorData.email}
                    onChange={handleInspectorChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="phone"
                    placeholder="+91 9848011223"
                    value={inspectorData.phone}
                    onChange={handleInspectorChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Inspection District / Jurisdiction <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="district"
                  placeholder="e.g. Krishna District - Penamaluru Mandal"
                  value={inspectorData.district}
                  onChange={handleInspectorChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    placeholder="Min 6 characters"
                    value={inspectorData.password}
                    onChange={handleInspectorChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="confirm_password"
                    placeholder="Re-enter password"
                    value={inspectorData.confirm_password}
                    onChange={handleInspectorChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                ℹ️ Once approved by the State Administrator, the administrator will assign a set of schools to you for monitoring water telemetry, digital twin simulations, and verifying mid-day meal preparations.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Submit Field Inspector Registration</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300 hover:underline">
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
