export type Priority = 'p1' | 'p2' | 'p3' | 'p4';

export interface Task {
  id: string;
  content: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  projectId: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  order: number;
  labels: string[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  isArchived: boolean;
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  theme: 'light' | 'dark';
  view: 'today' | 'upcoming' | 'inbox' | 'project';
  selectedProjectId?: string;
  searchQuery: string;
}