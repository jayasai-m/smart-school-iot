import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';

export const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-10 px-6 shadow-2xl rounded-2xl sm:px-10 text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Registration Submitted
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Your registration is awaiting administrator approval.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Account Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                PENDING APPROVAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
              State monitoring officials review and authorize new registrations (School Nodes and Field Inspectors) before granting portal and IoT access. Please check back after administrator review.
            </p>
          </div>

          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Login Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
