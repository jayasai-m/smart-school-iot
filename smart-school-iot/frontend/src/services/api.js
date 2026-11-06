import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const baseURL = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, '')}/api`
  : '/api';

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const backendBase = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBase}${cleanPath}`;
};

// Attach Authorization Bearer token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (data) => API.post('/auth/register', data),
  registerInspector: (data) => API.post('/auth/register-inspector', data),
  getMe: () => API.get('/auth/me')
};

// Admin endpoints
export const adminService = {
  getDashboard: () => API.get('/admin/dashboard'),
  getApprovals: () => API.get('/admin/approvals'),
  processApproval: (schoolId, action, notes) => API.post(`/admin/approvals/${schoolId}`, { action, notes }),
  getSchools: () => API.get('/admin/schools'),
  getSchoolDetails: (schoolId) => API.get(`/admin/schools/${schoolId}`),
  updateThresholds: (schoolId, thresholds) => API.put(`/admin/schools/${schoolId}/thresholds`, thresholds),
  getDigitalTwin: (schoolId) => API.get('/admin/digital-twin', { params: { school_id: schoolId } }),
  getWater: (schoolId) => API.get('/admin/water', { params: { school_id: schoolId } }),
  getMeals: (params) => API.get('/admin/meals', { params }),
  reviewImage: (imageId, status, admin_notes) => API.post(`/admin/images/${imageId}/review`, { status, admin_notes }),
  getAlerts: (params) => API.get('/admin/alerts', { params }),
  actOnAlert: (alertId, status, notes) => API.post(`/admin/alerts/${alertId}/action`, { status, notes }),
  getReports: (schoolId) => API.get('/admin/reports', { params: { school_id: schoolId } }),
  getAuditLogs: () => API.get('/admin/audit-logs'),
  // Inspector management & progress tracking
  getInspectors: () => API.get('/admin/inspectors'),
  getPendingInspectors: () => API.get('/admin/inspectors/pending'),
  processInspectorApproval: (inspectorId, action, notes) => API.post(`/admin/inspectors/${inspectorId}/approval`, { action, notes }),
  getAvailableSchools: () => API.get('/admin/inspectors/available-schools'),
  assignSchoolsToInspector: (inspectorId, schoolIds) => API.post(`/admin/inspectors/${inspectorId}/assign-schools`, { school_ids: schoolIds }),
  getInspectorProgress: (inspectorId) => API.get(`/admin/inspectors/${inspectorId}/progress`)
};

// Inspector endpoints (strictly scoped to assigned schools)
export const inspectorService = {
  getDashboard: () => API.get('/inspector/dashboard'),
  getSchools: () => API.get('/inspector/schools'),
  getDigitalTwin: (schoolId) => API.get('/inspector/digital-twin', { params: { school_id: schoolId } }),
  getWater: (schoolId) => API.get('/inspector/water', { params: { school_id: schoolId } }),
  getMeals: (params) => API.get('/inspector/meals', { params }),
  reviewImage: (imageId, status, admin_notes) => API.post(`/inspector/images/${imageId}/review`, { status, admin_notes }),
  getAlerts: (params) => API.get('/inspector/alerts', { params }),
  actOnAlert: (alertId, status, notes) => API.post(`/inspector/alerts/${alertId}/action`, { status, notes })
};

// School endpoints (strictly isolated)
export const schoolService = {
  getDashboard: () => API.get('/school/dashboard'),
  getDigitalTwin: () => API.get('/school/digital-twin'),
  getWater: () => API.get('/school/water'),
  getMeals: () => API.get('/school/meals'),
  submitMeal: (data) => API.post('/school/meals', data),
  uploadImage: (formData) => API.post('/school/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAlerts: () => API.get('/school/alerts'),
  getProfile: () => API.get('/school/profile')
};

// Hardware testing/diagnostic endpoints
export const hardwareService = {
  sendTelemetry: (payload) => API.post('/hardware/telemetry', payload),
  checkStatus: (schoolId) => API.get(`/hardware/status/${schoolId}`)
};

export default API;
