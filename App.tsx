
import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { TextInput, TextArea } from './components/InputGroup';
import { LoginPage } from './components/LoginPage';
import { Library } from './components/Library';
import { GarmentFormData, AppState, GenerationMode, User } from './types';
import { generateModelImage } from './services/geminiService';
import { db } from './services/database';
import { Camera, Sparkles, AlertCircle, Download, RefreshCw, Users, Shirt, LogOut, LayoutGrid, PlusSquare } from 'lucide-react';

const INITIAL_FORM_STATE: GarmentFormData = {
  garmentType: '',
  modelSpec: '',
  pose: '',
  imageFile: null,
  modelImageFile: null,
  mode: 'ai-model',
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'create' | 'library'>('create');
  
  const [formData, setFormData] = useState<GarmentFormData>(INITIAL_FORM_STATE);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const user = await db.getCurrentUser();
      setCurrentUser(user);
      setIsLoadingUser(false);
    };
    checkSession();

    const { data: { subscription } } = db.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (!user) {
        setFormData(INITIAL_FORM_STATE);
        setGeneratedResult(null);
        setAppState(AppState.IDLE);
        setView('create');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    // Auth state change listener will update currentUser
    setView('create');
  };

  const handleLogout = async () => {
    await db.logout();
    // Auth state change listener will handle state cleanup
  };

  const handleInputChange = (field: keyof GarmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (file: File | null) => {
    setFormData(prev => ({ ...prev, imageFile: file }));
  };
  
  const handleModelImageSelect = (file: File | null) => {
    setFormData(prev => ({ ...prev, modelImageFile: file }));
  };

  const handleModeChange = (mode: GenerationMode) => {
    setFormData(prev => ({ ...prev, mode }));
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    // Validate common fields
    if (!formData.imageFile || !formData.garmentType) {
      setErrorMessage("Please upload a garment image and describe it.");
      return;
    }

    // Validate mode specific fields
    if (formData.mode === 'ai-model') {
      if (!formData.modelSpec || !formData.pose) {
        setErrorMessage("Please specify model details and pose.");
        return;
      }
    } else if (formData.mode === 'custom-model') {
      if (!formData.modelImageFile) {
        setErrorMessage("Please upload a model photo.");
        return;
      }
    }

    setAppState(AppState.GENERATING);
    setErrorMessage(null);
    setGeneratedResult(null);

    try {
      const resultUrl = await generateModelImage(formData);
      
      setGeneratedResult(resultUrl);
      setAppState(AppState.SUCCESS);

      // Auto-save to database
      try {
        await db.saveProject(currentUser.id, resultUrl, formData.garmentType, formData.mode);
      } catch (saveError) {
        console.warn("Failed to save to history:", saveError);
      }

    } catch (error) {
      setAppState(AppState.ERROR);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const getNoteText = () => {
    switch (formData.mode) {
      case 'ai-model':
        return "The AI will generate a professional model based on your description wearing your garment.";
      case 'custom-model':
        return "The AI will transfer the garment from the first image (either flat or worn) onto the specific person in the second image.";
      case 'flat-lay':
        return "The AI will isolate the garment from your photo (even if worn) and create a professional, clean flat-lay studio shot.";
      default:
        return "";
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-luxe-gold"></div>
      </div>
    );
  }

  // Render Login Page if not authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('create')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-luxe-gold to-yellow-600 rounded-sm flex items-center justify-center">
              <Camera className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-white tracking-wide">Outfit AI</h1>
              <p className="text-[10px] text-luxe-gold uppercase tracking-[0.2em]">Virtual Studio</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            {/* Navigation */}
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setView('create')}
                className={`text-sm font-medium uppercase tracking-wider flex items-center space-x-2 transition-colors ${view === 'create' ? 'text-luxe-gold' : 'text-gray-400 hover:text-white'}`}
              >
                <PlusSquare className="w-4 h-4" />
                <span>Create</span>
              </button>
              <button 
                onClick={() => setView('library')}
                className={`text-sm font-medium uppercase tracking-wider flex items-center space-x-2 transition-colors ${view === 'library' ? 'text-luxe-gold' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>My Library</span>
              </button>
            </nav>

            <div className="h-6 w-px bg-white/10 hidden md:block"></div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-white font-medium">{currentUser.username}</p>
                <p className="text-[10px] text-luxe-gold uppercase">Pro Plan</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {view === 'library' ? (
        // Library View
        <main className="flex-1 max-w-7xl mx-auto w-full p-6">
          <div className="mb-8 flex items-end justify-between">
             <div>
                <h2 className="text-3xl font-serif text-white mb-2">My Library</h2>
                <p className="text-gray-500 text-sm">Your generated collection.</p>
             </div>
             <button onClick={() => setView('create')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-sm text-xs uppercase tracking-wider transition-colors">
               Create New
             </button>
          </div>
          <Library userId={currentUser.id} />
        </main>
      ) : (
        // Create/Studio View
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="bg-white/5 border border-white/5 p-6 rounded-sm">
              <h2 className="text-xl font-serif text-white mb-6 flex items-center">
                <span className="w-1 h-6 bg-luxe-gold mr-3"></span>
                Configuration
              </h2>

              {/* Mode Switcher */}
              <div className="grid grid-cols-3 gap-1 mb-8 bg-black/40 p-1 rounded-sm border border-white/10">
                <button 
                  onClick={() => handleModeChange('ai-model')}
                  className={`py-2 text-[10px] sm:text-xs font-medium uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center sm:space-x-2 transition-all duration-300 rounded-sm
                    ${formData.mode === 'ai-model' ? 'bg-white/10 text-luxe-gold shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Sparkles className="w-3 h-3 mb-1 sm:mb-0" />
                  <span>AI Model</span>
                </button>
                <button 
                  onClick={() => handleModeChange('custom-model')}
                  className={`py-2 text-[10px] sm:text-xs font-medium uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center sm:space-x-2 transition-all duration-300 rounded-sm
                    ${formData.mode === 'custom-model' ? 'bg-white/10 text-luxe-gold shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Users className="w-3 h-3 mb-1 sm:mb-0" />
                  <span>My Model</span>
                </button>
                <button 
                  onClick={() => handleModeChange('flat-lay')}
                  className={`py-2 text-[10px] sm:text-xs font-medium uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center sm:space-x-2 transition-all duration-300 rounded-sm
                    ${formData.mode === 'flat-lay' ? 'bg-white/10 text-luxe-gold shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Shirt className="w-3 h-3 mb-1 sm:mb-0" />
                  <span>Flat Lay</span>
                </button>
              </div>
              
              <ImageUploader 
                label={formData.mode === 'custom-model' || formData.mode === 'flat-lay' ? "Garment Reference (Flat/Worn)" : "Garment Source Image"}
                onImageSelect={handleImageSelect} 
                selectedFile={formData.imageFile}
              />

              <TextInput 
                label="Garment Description"
                placeholder="e.g. A deep emerald green silk cocktail dress"
                value={formData.garmentType}
                onChange={(e) => handleInputChange('garmentType', e.target.value)}
              />

              {formData.mode === 'ai-model' && (
                <>
                  <TextArea
                    label="Model Specification"
                    placeholder="e.g. A tall female model of South Asian descent with straight black hair, wearing minimal jewelry"
                    value={formData.modelSpec}
                    onChange={(e) => handleInputChange('modelSpec', e.target.value)}
                  />

                  <TextArea
                    label="Desired Pose"
                    placeholder="e.g. Standing in a three-quarter turn, right hand resting on hip, looking directly at the camera"
                    value={formData.pose}
                    onChange={(e) => handleInputChange('pose', e.target.value)}
                  />
                </>
              )}

              {formData.mode === 'custom-model' && (
                <ImageUploader 
                  label="Target Model Image"
                  onImageSelect={handleModelImageSelect}
                  selectedFile={formData.modelImageFile}
                />
              )}

              {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={appState === AppState.GENERATING}
                className={`w-full py-4 px-6 mt-4 font-medium uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center space-x-2
                  ${appState === AppState.GENERATING 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-luxe-gold hover:text-white'
                  }`}
              >
                {appState === AppState.GENERATING ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed">
              <p className="mb-2 uppercase tracking-wide font-bold text-gray-500">Note</p>
              {getNoteText()}
            </div>
          </div>

          {/* Right Column: Preview/Result */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex-1 bg-black border border-white/10 relative min-h-[500px] lg:min-h-0 flex items-center justify-center p-4">
              {/* Grid background effect */}
              <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}></div>

              {appState === AppState.IDLE && (
                <div className="text-center z-10">
                  <div className="w-20 h-20 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white/20">
                      <Camera className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-serif text-white/40">Studio Idle</h3>
                  <p className="text-gray-600 mt-2">Configure the shoot settings to begin.</p>
                </div>
              )}

              {appState === AppState.GENERATING && (
                <div className="text-center z-10 animate-pulse">
                  <div className="w-24 h-32 border border-luxe-gold/30 mx-auto mb-6 relative overflow-hidden bg-white/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-luxe-gold/20 to-transparent animate-scan"></div>
                  </div>
                  <h3 className="text-xl font-serif text-white">Developing...</h3>
                  <p className="text-luxe-gold text-sm mt-2 tracking-widest uppercase">AI Processing</p>
                </div>
              )}

              {generatedResult && appState === AppState.SUCCESS && (
                <div className="relative w-full h-full flex items-center justify-center z-10 group">
                  <img 
                    src={generatedResult} 
                    alt="Generated Result" 
                    className="max-w-full max-h-[800px] object-contain shadow-2xl"
                  />
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <a 
                        href={generatedResult} 
                        download="outfit-ai-generated.png"
                        className="bg-white text-black p-3 rounded-full hover:bg-luxe-gold hover:text-white transition-colors flex shadow-lg"
                        title="Download Image"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                  </div>
                </div>
              )}
              
              {appState === AppState.ERROR && (
                  <div className="text-center z-10 max-w-md">
                    <div className="w-16 h-16 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-serif text-white">Generation Failed</h3>
                    <p className="text-red-400 mt-2 text-sm">{errorMessage}</p>
                  </div>
              )}
            </div>

            {/* Footer status bar in the preview area */}
            <div className="h-12 border-t border-luxe-gold/20 bg-luxe-gold/5 flex items-center px-6 justify-between text-[10px] uppercase tracking-wider text-luxe-gold font-medium">
              <span>Status: {appState}</span>
              <span>Gemini 2.5 Flash Image Model</span>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
