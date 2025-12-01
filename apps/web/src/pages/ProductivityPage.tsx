import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout';
import { useProductivityStore } from '../store/productivityStore';
import { TaskList, FocusTimer, NoteEditor } from '../components/productivity';

export function ProductivityPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'timer' | 'notes'>('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as const });
  
  const { 
    tasks, 
    notes, 
    stats, 
    loading, 
    fetchTasks, 
    createTask, 
    updateTask,
    deleteTask,
    fetchNotes,
    createNote,
    fetchStats 
  } = useProductivityStore();

  useEffect(() => {
    fetchTasks();
    fetchNotes();
    fetchStats();
  }, []);

  const handleAddTask = async () => {
    if (newTask.title.trim()) {
      await createTask({ 
        title: newTask.title, 
        status: 'todo', 
        priority: newTask.priority 
      });
      setNewTask({ title: '', priority: 'medium' });
      setShowAddTask(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'todo' | 'in_progress' | 'done') => {
    await updateTask(id, { status });
  };

  const completedToday = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productivity Hub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your tasks, focus time, and notes
            </p>
          </div>
          <div className="flex gap-2">
            {(['tasks', 'timer', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab === 'tasks' ? '📋 Tasks' : tab === 'timer' ? '⏱️ Focus' : '📝 Notes'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">{completedToday}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">{inProgress}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-600">{todo}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">To Do</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-purple-600">{stats?.pomodorosCompleted || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pomodoros</p>
          </div>
        </div>

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowAddTask(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Add Task
              </button>
            </div>

            {showAddTask && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button onClick={handleAddTask} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Add</button>
                  <button onClick={() => setShowAddTask(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tasks.length > 0 ? (
              <TaskList 
                tasks={tasks} 
                onTaskClick={(id) => console.log('Task clicked:', id)}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
                <span className="text-4xl mb-4 block">📋</span>
                <p className="text-gray-500 dark:text-gray-400">No tasks yet. Add your first task to get started!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="max-w-md mx-auto">
            <FocusTimer />
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Focus Tips</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Work in 25-minute focused sessions</li>
                <li>• Take 5-minute breaks between sessions</li>
                <li>• After 4 sessions, take a longer 15-30 minute break</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <NoteEditor onSave={(title, content) => createNote(title, content)} />
            
            {notes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Notes</h3>
                <div className="space-y-3">
                  {notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white">{note.title || 'Untitled'}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{note.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
