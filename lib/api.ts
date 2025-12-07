import axios from 'axios';

interface CreateTaskData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_URL,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const taskAPI = {
  create: (data: CreateTaskData) => api.post('/tasks', data),
  getAll: () => api.get('/tasks'),
  getById: (id: number) => api.get(`/tasks/${id}`),
  update: (id: number, data: UpdateTaskData) => api.put(`/tasks/${id}`, data),  // ← SUDAH ADA
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getAllTasks: () => api.get('/admin/tasks'),
  promoteUser: (userId: number) => api.post(`/admin/promote/${userId}`),
  deleteTask: (taskId: number) => api.delete(`/admin/tasks/${taskId}`),
};
