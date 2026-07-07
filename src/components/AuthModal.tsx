import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import { X, Lock, Mail, UserPlus, LogIn, AlertCircle, RefreshCw } from 'lucide-react';
import { triggerToast } from '../utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userId: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      triggerToast('Successfully signed in with Google!', 'success');
      onAuthSuccess(userCredential.user.uid);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups or try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in your Firebase console. Please go to Firebase Console > Build > Authentication > Sign-in method, and enable "Google"!');
      } else {
        setError(err.message || 'An error occurred during Google authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user.uid);
        onClose();
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user.uid);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is not enabled in your Firebase console. Please go to Firebase Console > Build > Authentication > Sign-in method, and enable "Email/Password"!');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-6 md:p-8 animate-scale-up"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-medical-50 text-medical-600 mb-3">
            {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {isSignUp ? 'Create Sync Account' : 'Sign in to Cloud Sync'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isSignUp 
              ? 'Access and sync your NEET study progress across tablet and mobile devices for free.' 
              : 'Sign in to synchronize your study logs and schedules securely.'}
          </p>
          {isSignUp && (
            <div className="mt-3.5 px-3 py-2 bg-emerald-50 border border-emerald-100/60 text-emerald-800 rounded-xl text-[10.5px] font-medium leading-relaxed text-left flex items-start gap-1.5">
              <span className="text-base select-none mt-0.5 leading-none">💡</span>
              <span>
                <strong>Onboarding Tip:</strong> You can enter <strong>any email</strong> of your choice (e.g. <code>student@neet.com</code>) and a 6-character password. No email activation or code is required!
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="mb-4">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-3.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or continue with email</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl outline-none focus:border-medical-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl outline-none focus:border-medical-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Confirm Password (Sign up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl outline-none focus:border-medical-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => { setIsSignUp(false); setError(''); }}
                className="font-bold text-medical-600 hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => { setIsSignUp(true); setError(''); }}
                className="font-bold text-medical-600 hover:underline"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
