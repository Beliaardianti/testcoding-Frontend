'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { taskAPI } from '../../../../lib/api';

interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const { user, logout, loading: authLoading } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTask();
    }
  }, [user, taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getById(parseInt(taskId));
      setTask(response.data);
      setEditTitle(response.data.title);
      setEditDescription(response.data.description);
      setEditPriority(response.data.priority);
      setEditDueDate(response.data.due_date);
    } catch (_err) {
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!task) return;

    setError('');

    if (!editTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await taskAPI.update(task.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate,
      });

      setIsEditing(false);
      fetchTask();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error: string } } };
      setError(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleUpdateStatus = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!task) return;

    try {
      await taskAPI.update(task.id, { status: newStatus });
      fetchTask();
    } catch (_err) {
      setError('Failed to update status');
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    if (!task) return;

    try {
      await taskAPI.delete(task.id);
      router.push('/dashboard');
    } catch (_err) {
      setError('Failed to delete task');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-gray-600 font-medium mb-4">Task not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Task Detail Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header with Title and Actions */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-3xl font-bold text-gray-900 border-2 border-indigo-500 rounded-lg px-4 py-2"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200"
                  title="Edit task"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleDeleteTask}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-red-200"
                title="Delete task"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={task.status}
                onChange={(e) => handleUpdateStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 cursor-pointer transition-all ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : task.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              {isEditing ? (
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="px-4 py-2 border-2 border-indigo-500 rounded-lg text-sm font-semibold"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold inline-block ${
                    task.priority === 'high'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                      : task.priority === 'medium'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                      : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                  }`}
                >
                  {task.priority.toUpperCase()}
                </span>
              )}
            </div>

            {task.due_date && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="px-4 py-2 border-2 border-indigo-500 rounded-lg text-sm font-semibold"
                  />
                ) : (
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 border-2 border-purple-200 rounded-lg text-sm font-semibold inline-block">
                    📅 {new Date(task.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-4 py-3 border-2 border-indigo-500 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={6}
                placeholder="Task description..."
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-6 py-6 border-t border-gray-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Created At</label>
              <p className="text-gray-600">
                {new Date(task.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Task ID</label>
              <p className="text-gray-600">#{task.id}</p>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
