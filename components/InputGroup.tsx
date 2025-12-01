import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, className, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">
      {label}
    </label>
    <input
      className={`w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-luxe-gold focus:ring-1 focus:ring-luxe-gold transition-all duration-300 ${className}`}
      {...props}
    />
  </div>
);

export const TextArea: React.FC<TextAreaProps> = ({ label, className, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">
      {label}
    </label>
    <textarea
      className={`w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-luxe-gold focus:ring-1 focus:ring-luxe-gold transition-all duration-300 min-h-[100px] ${className}`}
      {...props}
    />
  </div>
);