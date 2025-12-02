import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, SavedProject, GenerationMode } from '../types.ts';

// Supabase Configuration
const PROJECT_URL = 'https://tferpsxzuzmwarcihrwv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJwc3h6dXptd2FyY2locnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTM1NjMsImV4cCI6MjA4MDE2OTU2M30.nbJp0CTkMcbwC7nWEST5XZBrT6XB-3vkb-qgCRMViUY';

class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(PROJECT_URL, ANON_KEY);
  }

  // --- Auth Methods ---

  async register(username: string, email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed.');

    return this.mapSupabaseUser(data.user);
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed.');

    return this.mapSupabaseUser(data.user);
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getSession();
    if (!data.session?.user) return null;
    return this.mapSupabaseUser(data.session.user);
  }
  
  // Method to listen for auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ? this.mapSupabaseUser(session.user) : null);
    });
  }

  // --- Project/Data Methods ---

  async saveProject(userId: string, imageUrl: string, garmentType: string, mode: GenerationMode): Promise<SavedProject> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert([
        {
          user_id: userId,
          image_url: imageUrl,
          garment_type: garmentType,
          mode: mode,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }

    return this.mapProject(data);
  }

  async getUserProjects(userId: string): Promise<SavedProject[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(this.mapProject);
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error(error.message);
  }

  // --- Internal Helpers ---

  private mapSupabaseUser(user: SupabaseUser): User {
    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
      createdAt: new Date(user.created_at).getTime(),
    };
  }

  private mapProject(row: any): SavedProject {
    return {
      id: row.id,
      userId: row.user_id,
      imageUrl: row.image_url,
      garmentType: row.garment_type, 
      mode: row.mode,
      timestamp: new Date(row.created_at).getTime(),
    };
  }
}

export const db = new DatabaseService();