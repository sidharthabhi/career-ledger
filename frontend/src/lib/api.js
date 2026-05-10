import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Don't auto-redirect from login/signup endpoints
      const url = err.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
        localStorage.removeItem('cl_token')
        localStorage.removeItem('cl_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ============= Auth =============
export const authApi = {
  signup: (data) => api.post('/api/auth/signup', data).then(r => r.data),
  login: (data) => api.post('/api/auth/login', data).then(r => r.data),
  me: () => api.get('/api/auth/me').then(r => r.data),
}

// ============= Applications =============
export const appsApi = {
  list: (params = {}) => api.get('/api/applications', { params }).then(r => r.data),
  get: (id) => api.get(`/api/applications/${id}`).then(r => r.data),
  create: (data) => api.post('/api/applications', data).then(r => r.data),
  update: (id, data) => api.patch(`/api/applications/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/api/applications/${id}`).then(r => r.data),
  uploadResume: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/api/applications/${id}/resume`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  resumeUrl: (id) => `${API_BASE}/api/applications/${id}/resume/download`,
}

// ============= Analytics =============
export const analyticsApi = {
  dashboard: () => api.get('/api/analytics/dashboard').then(r => r.data),
  insights: () => api.get('/api/analytics/insights').then(r => r.data),
}

export function getError(err) {
  return err.response?.data?.detail || err.message || 'Something went wrong'
}
