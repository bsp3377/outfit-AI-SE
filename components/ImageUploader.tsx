
import React, { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  selectedFile: File | null;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  selectedFile,
  label = "Garment Source Image"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Sync preview with prop
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageSelect(files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">
        {label}
      </label>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed transition-all duration-300 group cursor-pointer relative
          ${preview 
            ? 'border-luxe-gold/50 bg-black' 
            : 'border-white/20 hover:border-luxe-gold/50 bg-white/5'
          }
          h-64 rounded-sm flex flex-col items-center justify-center
        `}
      >
        {preview ? (
          <div className="relative w-full h-full p-2">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button 
                onClick={removeFile}
                className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-luxe-gold mb-4 transition-colors" />
            <p className="text-sm text-gray-400 group-hover:text-white font-medium">Click to upload image</p>
            <p className="text-xs text-gray-600 mt-2">JPG, PNG, WebP</p>
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
