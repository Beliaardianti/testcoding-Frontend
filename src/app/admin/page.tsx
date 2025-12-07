'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { adminAPI } from '../../../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'tasks'>('users');
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);


  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [usersRes, tasksRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllTasks(),
      ]);
      setUsers(usersRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (_err) {
      setError('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handlePromoteUser = async (userId: number) => {
    if (!confirm('Promote this user to admin?')) return;

    try {
      await adminAPI.promoteUser(userId);
      fetchData();
    } catch (_err) {
      setError('Failed to promote user');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;

    try {
      await adminAPI.deleteTask(taskId);
      fetchData();
    } catch (_err) {
      setError('Failed to delete task');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name} (Admin)</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              My Tasks
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h2>

            {dataLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-600">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handlePromoteUser(u.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Promote to Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      

        {activeTab === 'tasks' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tasks</h2>

            {dataLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-600">No tasks found</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{task.description}</p>
                        <div className="flex gap-4 mt-3">
                          <span className="text-sm text-gray-600">
                            User: <span className="font-semibold">{users.find(u => u.id === task.user_id)?.name || 'Unknown'}</span>
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
