
import React, { useEffect, useState } from 'react';
import { SavedProject } from '../types';
import { db } from '../services/database';
import { Trash2, Download, Calendar, Shirt, Sparkles, Users } from 'lucide-react';

interface LibraryProps {
  userId: string;
}

export const Library: React.FC<LibraryProps> = ({ userId }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await db.getUserProjects(userId);
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent downloading if wrapped in link
    if (window.confirm('Are you sure you want to delete this image?')) {
      await db.deleteProject(id);
      loadProjects();
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ai-model': return <Sparkles className="w-3 h-3" />;
      case 'custom-model': return <Users className="w-3 h-3" />;
      case 'flat-lay': return <Shirt className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  if (loading) {
     return (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-luxe-gold"></div>
        </div>
     );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Shirt className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-xl font-serif text-white mb-2">No designs yet</h3>
        <p className="text-sm">Generate your first outfit to see it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="bg-white/5 border border-white/10 rounded-sm overflow-hidden group hover:border-luxe-gold/50 transition-all duration-300">
          <div className="aspect-[3/4] relative overflow-hidden bg-black/50">
            <img 
              src={project.imageUrl} 
              alt={project.garmentType} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
              <a 
                href={project.imageUrl}
                download={`outfit-ai-${project.id}.png`}
                className="p-3 bg-white text-black rounded-full hover:bg-luxe-gold hover:text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
              <button 
                onClick={(e) => handleDelete(project.id, e)}
                className="p-3 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Badge */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-sm flex items-center space-x-1 text-[10px] uppercase tracking-wider text-white border border-white/10">
              {getModeIcon(project.mode)}
              <span>{project.mode.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="p-4">
            <h4 className="font-serif text-white truncate mb-1">{project.garmentType}</h4>
            <div className="flex items-center text-xs text-gray-500 space-x-2">
              <Calendar className="w-3 h-3" />
              <span>{new Date(project.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
