
import React, { useState } from 'react';
import { Camera, ArrowRight, Sparkles, Lock, UserPlus } from 'lucide-react';
import { TextInput } from './InputGroup';
import { db } from '../services/database';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate network delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));

      let user: User;
      
      if (isLoginMode) {
        if (!username || !password) throw new Error("Username and password required.");
        user = db.login(username, password);
      } else {
        if (!username || !password || !email) throw new Error("All fields are required.");
        user = db.register(username, email, password);
      }
      
      onLogin(user);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    // Simulate Google OAuth delay
    setTimeout(() => {
      // Create a mock Google user
      try {
        let user;
        try {
           user = db.login("google_user", "google_pass");
        } catch {
           user = db.register("google_user", "google@example.com", "google_pass");
        }
        onLogin(user);
      } catch (err) {
        setError("Google Login Failed");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-sans text-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-luxe-gold/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
            backgroundSize: '30px 30px'
        }}></div>
      </div>

      <div className="w-full max-w-md z-10 px-6">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-luxe-gold to-yellow-600 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-lg shadow-luxe-gold/20">
            <Camera className="text-black w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif text-white tracking-wide mb-2">Outfit AI</h1>
          <p className="text-xs text-luxe-gold uppercase tracking-[0.3em]">Virtual Styling Studio</p>
        </div>

        {/* Login/Signup Form */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-sm shadow-2xl transition-all duration-500">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-serif mb-1 transition-all duration-300">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-gray-500 transition-all duration-300">
                {isLoginMode ? 'Enter your credentials to access the studio.' : 'Join the leading AI fashion platform.'}
              </p>
            </div>

            <div className="space-y-0 transition-all duration-300">
              <TextInput 
                label={isLoginMode ? "Username or Email" : "Username"}
                type="text"
                placeholder={isLoginMode ? "Enter username" : "Choose a username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                key={`username-${isLoginMode}`} 
                autoFocus={isLoginMode}
              />

              {/* Email field only for Registration */}
              {!isLoginMode && (
                <div className="animate-fade-in-down">
                  <TextInput 
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <TextInput 
                label="Password"
                type="password"
                placeholder={isLoginMode ? "Enter your password" : "Create a password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="mb-4 text-xs text-red-400 flex items-center space-x-2 bg-red-500/10 p-2 border border-red-500/20 rounded-sm animate-pulse">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 mt-2 font-medium uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center space-x-2 rounded-sm
                ${isLoading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-luxe-gold text-black hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                }`}
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  <span>{isLoginMode ? 'Authenticating...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  {isLoginMode ? <Lock className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  <span>{isLoginMode ? 'Access Studio' : 'Create Account'}</span>
                  {isLoginMode && <ArrowRight className="w-3 h-3 ml-1" />}
                </>
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="my-6 flex items-center justify-between">
             <div className="h-px bg-white/10 flex-1"></div>
             <span className="text-[10px] uppercase text-gray-500 px-4 tracking-wider">Or</span>
             <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-white text-gray-800 font-medium text-sm rounded-sm flex items-center justify-center space-x-3 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          >
             {/* Google G Logo SVG */}
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
             </svg>
             <span>{isLoginMode ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button 
              onClick={toggleMode}
              disabled={isLoading}
              className="text-xs text-gray-400 hover:text-luxe-gold transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              {isLoginMode ? (
                <span>Don't have an account? <span className="text-white border-b border-white/20 pb-0.5 hover:border-luxe-gold">Register now</span></span>
              ) : (
                <span>Already have an account? <span className="text-white border-b border-white/20 pb-0.5 hover:border-luxe-gold">Log in</span></span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[10px] text-gray-600 uppercase tracking-wider flex items-center justify-center space-x-2">
            <Sparkles className="w-3 h-3 text-gray-700" />
            <span>Powered by Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
};
