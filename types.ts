
export type GenerationMode = 'ai-model' | 'custom-model' | 'flat-lay';

export interface GarmentFormData {
  garmentType: string;
  modelSpec: string;
  pose: string;
  imageFile: File | null;
  modelImageFile: File | null;
  mode: GenerationMode;
}

export interface GeneratedImage {
  url: string;
  timestamp: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

export interface SavedProject {
  id: string;
  userId: string;
  imageUrl: string;
  garmentType: string;
  mode: GenerationMode;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}