
import { User, SavedProject, GenerationMode } from '../types';

const USERS_KEY = 'outfit_ai_users';
const PROJECTS_KEY = 'outfit_ai_projects';
const CURRENT_USER_KEY = 'outfit_ai_current_user';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

class DatabaseService {
  // --- Auth Methods ---

  register(username: string, email: string, password: string): User {
    const users = this.getUsers();
    
    // Check if user exists
    if (users.find(u => u.username === username || u.email === email)) {
      throw new Error('Username or Email already exists.');
    }

    const newUser: User = {
      id: generateId(),
      username,
      email,
      passwordHash: btoa(password), // Simple base64 for demo purposes. DO NOT use in production.
      createdAt: Date.now()
    };

    users.push(newUser);
    this.saveUsers(users);
    
    // Auto login after register
    this.setCurrentUser(newUser);
    return newUser;
  }

  login(identifier: string, password: string): User {
    const users = this.getUsers();
    const hash = btoa(password);
    
    const user = users.find(u => 
      (u.username === identifier || u.email === identifier) && u.passwordHash === hash
    );

    if (!user) {
      throw new Error('Invalid credentials.');
    }

    this.setCurrentUser(user);
    return user;
  }

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  // --- Project/Data Methods ---

  saveProject(userId: string, imageUrl: string, garmentType: string, mode: GenerationMode): SavedProject {
    const projects = this.getAllProjects();
    const newProject: SavedProject = {
      id: generateId(),
      userId,
      imageUrl,
      garmentType,
      mode,
      timestamp: Date.now()
    };

    projects.push(newProject);
    this.saveAllProjects(projects);
    return newProject;
  }

  getUserProjects(userId: string): SavedProject[] {
    const projects = this.getAllProjects();
    // Sort by newest first
    return projects
      .filter(p => p.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  deleteProject(projectId: string) {
    let projects = this.getAllProjects();
    projects = projects.filter(p => p.id !== projectId);
    this.saveAllProjects(projects);
  }

  // --- Internal Helpers ---

  private getUsers(): User[] {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  private setCurrentUser(user: User) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  private getAllProjects(): SavedProject[] {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveAllProjects(projects: SavedProject[]) {
    // Check for storage limits - simple check
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      throw new Error("Storage full. Delete some old images to save new ones.");
    }
  }
}

export const db = new DatabaseService();
