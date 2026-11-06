import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AdminRoute, SchoolRoute, InspectorRoute, PublicOnlyRoute } from './routes/RouteGuards';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { SchoolLayout } from './layouts/SchoolLayout';
import { InspectorLayout } from './layouts/InspectorLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PendingApproval } from './pages/auth/PendingApproval';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDigitalTwin } from './pages/admin/AdminDigitalTwin';
import { AdminWater } from './pages/admin/AdminWater';
import { AdminMeals } from './pages/admin/AdminMeals';
import { AdminSchools } from './pages/admin/AdminSchools';
import { AdminSchoolDetails } from './pages/admin/AdminSchoolDetails';
import { AdminInspectors } from './pages/admin/AdminInspectors';
import { AdminApprovals } from './pages/admin/AdminApprovals';
import { AdminAlerts } from './pages/admin/AdminAlerts';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminProfile } from './pages/admin/AdminProfile';

// School Pages
import { SchoolDashboard } from './pages/school/SchoolDashboard';
import { SchoolDigitalTwin } from './pages/school/SchoolDigitalTwin';
import { SchoolWater } from './pages/school/SchoolWater';
import { SchoolMeals } from './pages/school/SchoolMeals';
import { SchoolAlerts } from './pages/school/SchoolAlerts';
import { SchoolProfile } from './pages/school/SchoolProfile';

// Inspector Pages
import { InspectorDashboard } from './pages/inspector/InspectorDashboard';
import { InspectorSchools } from './pages/inspector/InspectorSchools';
import { InspectorDigitalTwin } from './pages/inspector/InspectorDigitalTwin';
import { InspectorWater } from './pages/inspector/InspectorWater';
import { InspectorMeals } from './pages/inspector/InspectorMeals';
import { InspectorAlerts } from './pages/inspector/InspectorAlerts';
import { InspectorProfile } from './pages/inspector/InspectorProfile';

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="digital-twin" element={<AdminDigitalTwin />} />
              <Route path="water" element={<AdminWater />} />
              <Route path="meals" element={<AdminMeals />} />
              <Route path="schools" element={<AdminSchools />} />
              <Route path="schools/:schoolId" element={<AdminSchoolDetails />} />
              <Route path="inspectors" element={<AdminInspectors />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="alerts" element={<AdminAlerts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Route>

          {/* Field Inspector Protected Routes */}
          <Route element={<InspectorRoute />}>
            <Route path="/inspector" element={<InspectorLayout />}>
              <Route index element={<Navigate to="/inspector/dashboard" replace />} />
              <Route path="dashboard" element={<InspectorDashboard />} />
              <Route path="schools" element={<InspectorSchools />} />
              <Route path="digital-twin" element={<InspectorDigitalTwin />} />
              <Route path="water" element={<InspectorWater />} />
              <Route path="meals" element={<InspectorMeals />} />
              <Route path="alerts" element={<InspectorAlerts />} />
              <Route path="profile" element={<InspectorProfile />} />
            </Route>
          </Route>

          {/* School Protected Routes */}
          <Route element={<SchoolRoute />}>
            <Route path="/school" element={<SchoolLayout />}>
              <Route index element={<Navigate to="/school/dashboard" replace />} />
              <Route path="dashboard" element={<SchoolDashboard />} />
              <Route path="digital-twin" element={<SchoolDigitalTwin />} />
              <Route path="water" element={<SchoolWater />} />
              <Route path="meals" element={<SchoolMeals />} />
              <Route path="alerts" element={<SchoolAlerts />} />
              <Route path="profile" element={<SchoolProfile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}
