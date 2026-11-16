import axios from 'axios'

const api = axios.create({ baseURL: '' })

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post('/api/v1/login', { username, password })
export const register = (username: string, email: string, password: string) =>
  api.post('/api/v1/register', { username, email, password, role: 'admin' })
export const getMe = () => api.get('/api/v1/me')

// ── Projects ──────────────────────────────────────────────────────────────
export const getProjects = () => api.get('/api/v1/projects')
export const createProject = (name: string, description: string) =>
  api.post('/api/v1/projects', { name, description })
export const getProject = (id: number) => api.get(`/api/v1/projects/${id}`)
export const deleteProject = (id: number) => api.delete(`/api/v1/projects/${id}`)

// ── Environments ──────────────────────────────────────────────────────────
export const getEnvironments = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/environments`)
export const createEnvironment = (projectId: number, name: string, env_type: string) =>
  api.post(`/api/v1/projects/${projectId}/environments`, { name, env_type })

// ── Deployments ───────────────────────────────────────────────────────────
export const getDeployments = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/deployments`)
export const createDeployment = (projectId: number, environment_id: number, image_tag: string) =>
  api.post(`/api/v1/projects/${projectId}/deployments`, { environment_id, image_tag })
export const rollbackDeployment = (id: number) =>
  api.post(`/api/v1/deployments/${id}/rollback`)

// ── Infrastructure Stacks ─────────────────────────────────────────────────
export const getStacks = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/stacks`)
export const createStack = (projectId: number, data: any) =>
  api.post(`/api/v1/projects/${projectId}/stacks`, data)
export const planStack = (id: number) => api.post(`/api/v1/stacks/${id}/plan`)
export const applyStack = (id: number) => api.post(`/api/v1/stacks/${id}/apply`)

// ── Pipelines ─────────────────────────────────────────────────────────────
export const getPipelines = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/pipelines`)
export const triggerPipeline = (projectId: number) =>
  api.post(`/api/v1/projects/${projectId}/pipelines`)
export const getPipeline = (id: number) =>
  api.get(`/api/v1/pipelines/${id}`)
export const getJenkinsStatus = () =>
  api.get('/api/v1/jenkins/status')

// ── Security ──────────────────────────────────────────────────────────────
export const triggerScan = (deploymentId: number) =>
  api.post(`/api/v1/deployments/${deploymentId}/scan`)
export const getScans = (deploymentId: number) =>
  api.get(`/api/v1/deployments/${deploymentId}/scans`)
export const getScan = (id: number) => api.get(`/api/v1/scans/${id}`)
export const getScanGate = (scanId: number) => api.get(`/api/v1/scans/${scanId}/gate`)

// ── Monitoring ────────────────────────────────────────────────────────────
export const getMetrics = () => api.get('/api/v1/metrics-data')
export const getAlerts = () => api.get('/api/v1/alerts')
export const resolveAlert = (id: number) => api.put(`/api/v1/alerts/${id}/resolve`)
export const getHealth = () => api.get('/api/v1/health')

// ── Governance ────────────────────────────────────────────────────────────
export const getPolicies = () => api.get('/api/v1/policies')
export const createPolicy = (data: any) => api.post('/api/v1/policies', data)
export const evaluateCompliance = (projectId: number) =>
  api.post(`/api/v1/projects/${projectId}/evaluate`)
export const getCompliance = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/compliance`)
export const getAuditLogs = () => api.get('/api/v1/audit-logs')

// ── Reliability ───────────────────────────────────────────────────────────
export const getDebt = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/debt`)
export const createDebt = (projectId: number, data: any) =>
  api.post(`/api/v1/projects/${projectId}/debt`, data)
export const getExperiments = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/experiments`)
export const createExperiment = (projectId: number, data: any) =>
  api.post(`/api/v1/projects/${projectId}/experiments`, data)

// ── Cost & Billing Optimization (FinOps) ──────────────────────────────────
export const getProjectCosts = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/costs`)
export const getCostRecommendations = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/cost-recommendations`)
export const getProjectCostRecommendations = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/cost-recommendations`)
export const applyCostRecommendation = (id: number) =>
  api.post(`/api/v1/cost-recommendations/${id}/apply`)
export const applyRecommendation = (id: number) =>
  api.post(`/api/v1/cost-recommendations/${id}/apply`)
export const getBudget = (projectId: number) =>
  api.get(`/api/v1/projects/${projectId}/budget`)
export const setBudget = (projectId: number, monthly_budget: number, alert_threshold_percent: number) =>
  api.post(`/api/v1/projects/${projectId}/budget`, { monthly_budget, alert_threshold_percent })
export const simulateBilling = (projectId: number) =>
  api.post(`/api/v1/projects/${projectId}/simulate-billing`)
export const getGlobalCostSummary = () =>
  api.get('/api/v1/costs/summary')

// ── AWS Cloud & Free-Tier Integration ─────────────────────────────────────
export const getAWSStatus = () =>
  api.get('/api/v1/aws/status')
export const uploadAWSArtifact = (bucket: string, key: string, content: string, content_type = 'application/json') =>
  api.post('/api/v1/aws/artifacts', { bucket, key, content, content_type })

export default api
