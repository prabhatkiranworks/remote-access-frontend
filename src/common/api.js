import axios from 'axios'

export const API_BASE_URL = '/api'

export const API_PATHS = {
  signUp:        '/auth/register',
  signIn:        '/auth/login',
  explorer:      '/explorer',
  upload:        '/files/upload',
  download:      '/files/download',
  downloadZip:   '/files/download-zip',
  createFolder:  '/files/create-folder',
  rename:        '/files/rename',
  delete:        '/files/delete',
}

// ─── Token storage (in-memory only — never localStorage) ─────────────────────
let _token = null

export function setAuthToken(token) {
  _token = token
}

export function clearAuthToken() {
  _token = null
}

export function getAuthToken() {
  return _token
}

// ─── Axios instance ───────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token on every request
apiClient.interceptors.request.use((config) => {
  if (_token) {
    config.headers['Authorization'] = `Bearer ${_token}`
  }
  return config
})

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn('[api] Session expired or unauthorized.')
      clearAuthToken()
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signOut() {
  clearAuthToken()
  // No backend logout endpoint needed for stateless JWT — just clear the token
}

// ─── Explorer ────────────────────────────────────────────────────────────────

/**
 * List files/folders at a given path (empty string = root).
 * Returns: [{ name, path, type: 'DIRECTORY'|'FILE', size }]
 */
export async function listDirectory(path = '') {
  const params = path ? { path } : {}
  const res = await apiClient.get(API_PATHS.explorer, { params })
  return res.data
}

// ─── Files ───────────────────────────────────────────────────────────────────

export async function uploadFile(file, folderPath) {
  const form = new FormData()
  form.append('file', file)
  if (folderPath) form.append('path', folderPath)
  const res = await apiClient.post(API_PATHS.upload, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function downloadFile(filePath) {
  const res = await apiClient.get(API_PATHS.download, {
    params: { path: filePath },
    responseType: 'blob',
  })
  return res
}

export async function downloadZip(paths) {
  const res = await apiClient.post(API_PATHS.downloadZip, { path: paths }, {
    responseType: 'blob',
  })
  return res
}

export async function createFolder(path) {
  const res = await apiClient.post(API_PATHS.createFolder, { path })
  return res.data
}

export async function renameItem(oldPath, newName) {
  const res = await apiClient.post(API_PATHS.rename, { oldPath, newName })
  return res.data
}

export async function deleteItems(paths) {
  // paths is always an array — single item is [path]
  const res = await apiClient.delete(API_PATHS.delete, { data: { paths } })
  return res.data
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Trigger a browser download from a Blob response.
 * The `filename` argument is always used as-is — it comes from the item name
 * the user sees in the UI, so the downloaded file always matches what is shown.
 * The Content-Disposition header is only consulted as a last resort when no
 * filename is supplied.
 *
 * @param {AxiosResponse} res      - axios response with responseType: 'blob'
 * @param {string}        filename - the exact name to save the file as
 */
export function triggerBlobDownload(res, filename) {
  // Prefer the caller-supplied name; fall back to Content-Disposition only if blank
  let name = filename && filename.trim() ? filename.trim() : null

  if (!name) {
    const contentDisposition = res.headers?.['content-disposition'] || ''
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i)
    name = match ? decodeURIComponent(match[1].trim()) : 'download'
  }

  const url = URL.createObjectURL(res.data)
  const a   = document.createElement('a')
  a.href     = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
