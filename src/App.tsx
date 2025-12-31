import { useState, useEffect, useMemo } from 'react';
import { Task, Project, AppState, Priority } from './types';
import { loadState, saveState, exportData, exportToCSV } from './utils/storage';
import { initialTasks, initialProjects } from './utils/initialData';
import { Plus, Search, Sun, Moon, Calendar, Inbox, BarChart3, Download, Check, Trash2, FolderOpen, CheckCircle, FileText } from 'lucide-react';
import { format, isToday, isPast, parseISO } from 'date-fns';

const priorityColors = { p1: 'text-red-600 border-red-600', p2: 'text-orange-600 border-orange-600', p3: 'text-blue-600 border-blue-600', p4: 'text-gray-600 border-gray-600' };

function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadState();
    return { tasks: saved?.tasks || initialTasks, projects: saved?.projects || initialProjects, theme: (saved?.theme as 'light' | 'dark') || 'light', view: 'project' as const, selectedProjectId: saved?.selectedProjectId || 'documentation', searchQuery: '' };
  });

  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('p2');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { document.documentElement.classList.toggle('dark', state.theme === 'dark'); }, [state.theme]);

  const addTask = () => {
    if (!newTaskContent.trim()) return;
    const newTask: Task = { id: Date.now().toString(), content: newTaskContent, priority: newTaskPriority, dueDate: newTaskDate, projectId: state.selectedProjectId || 'inbox', completed: false, createdAt: new Date().toISOString(), order: state.tasks.length, labels: [] };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    setNewTaskContent('');
  };

  const toggleTask = (id: string) => setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t) }));
  const deleteTask = (id: string) => setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));

  const handleExport = (format: 'json' | 'csv') => {
    const data = format === 'json' ? exportData(state.tasks, state.projects) : exportToCSV(state.tasks);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
  };

  const filteredTasks = useMemo(() => {
    let filtered = state.tasks.filter(t => !t.completed);
    if (state.searchQuery) filtered = filtered.filter(t => t.content.toLowerCase().includes(state.searchQuery.toLowerCase()));
    if (state.view === 'today') filtered = filtered.filter(t => t.dueDate && isToday(parseISO(t.dueDate)));
    else if (state.view === 'upcoming') filtered = filtered.filter(t => t.dueDate && !isPast(parseISO(t.dueDate)));
    else if (state.view === 'inbox') filtered = filtered.filter(t => t.projectId === 'inbox');
    else if (state.view === 'project' && state.selectedProjectId) filtered = filtered.filter(t => t.projectId === state.selectedProjectId);
    return filtered.sort((a, b) => a.order - b.order);
  }, [state.tasks, state.view, state.selectedProjectId, state.searchQuery]);

  const currentProject = state.projects.find(p => p.id === state.selectedProjectId);
  const stats = useMemo(() => ({ total: state.tasks.length, completed: state.tasks.filter(t => t.completed).length, pending: state.tasks.filter(t => !t.completed).length, overdue: state.tasks.filter(t => !t.completed && t.dueDate && isPast(parseISO(t.dueDate))).length }), [state.tasks]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary-600" />
            Job Task Tracker
          </h1>
        </div>
        
        <nav className="flex-1 p-3 overflow-y-auto">
          <button onClick={() => setState(prev => ({ ...prev, view: 'inbox', selectedProjectId: 'inbox' }))} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${state.view === 'inbox' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Inbox className="w-5 h-5" />
            <span>Inbox</span>
          </button>

          <button onClick={() => setState(prev => ({ ...prev, view: 'today' }))} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${state.view === 'today' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Calendar className="w-5 h-5" />
            <span>Today</span>
          </button>

          <button onClick={() => setState(prev => ({ ...prev, view: 'upcoming' }))} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-4 ${state.view === 'upcoming' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <FileText className="w-5 h-5" />
            <span>Upcoming</span>
          </button>

          <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Projects</div>
          {state.projects.filter(p => !p.isArchived).map(project => (
            <button key={project.id} onClick={() => setState(prev => ({ ...prev, view: 'project', selectedProjectId: project.id }))} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${state.view === 'project' && state.selectedProjectId === project.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="flex-1 text-left">{project.name}</span>
              <span className="text-xs text-gray-500">{state.tasks.filter(t => t.projectId === project.id && !t.completed).length}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button onClick={() => handleExport('json')} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button onClick={() => setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            {state.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {state.theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{currentProject?.name || state.view.charAt(0).toUpperCase() + state.view.slice(1)}</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search tasks..." value={state.searchQuery} onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))} className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{stats.pending}</span> pending · <span className="font-semibold">{stats.completed}</span> completed
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-2">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleTask(task.id)} className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-primary-600 dark:hover:border-primary-400 flex items-center justify-center flex-shrink-0">
                    {task.completed && <Check className="w-3 h-3 text-primary-600" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-gray-800 dark:text-white ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.content}</p>
                      <span className={`text-xs px-2 py-0.5 border rounded ${priorityColors[task.priority]}`}>{task.priority.toUpperCase()}</span>
                    </div>
                    {task.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${task.dueDate && isPast(parseISO(task.dueDate)) && !task.completed ? 'text-red-600' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      {task.labels.map(label => <span key={label} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{label}</span>)}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No tasks found. Add a new task to get started!</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input type="text" placeholder="Add a new task..." value={newTaskContent} onChange={(e) => setNewTaskContent(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTask()} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
            <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
              <option value="p1">P1</option>
              <option value="p2">P2</option>
              <option value="p3">P3</option>
              <option value="p4">P4</option>
            </select>
            <button onClick={addTask} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;