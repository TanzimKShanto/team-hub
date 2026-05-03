import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true
})

const publicPaths = ['/auth/me', '/auth/login', '/auth/register']

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isPublicPath = publicPaths.some(p => original.url?.includes(p))
    
    if (error.response?.status === 401 && !original._retry && !isPublicPath) {
      original._retry = true
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        return api(original)
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
