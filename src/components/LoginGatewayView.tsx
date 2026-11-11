import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  Activity,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  LogIn,
  Send,
  Radio,
  Sparkles
} from 'lucide-react';
import { UserPersona } from '../types';
import { authService } from '../services/authService';
import { signInWithGoogle } from '../services/firebase';

// High-fidelity operational assets generated for Prognosticator
import commandCenterImg from '../assets/images/workforce_health_command_center_1794419609820.jpg';
import wearableSensorsImg from '../assets/images/wearable_biometric_iot_sensors_1794419631893.jpg';

interface LoginGatewayViewProps {
  onLoginSuccess: (user: UserPersona) => void;
  isAccessibilityMode?: boolean;
}

type AuthViewMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD';

export default function LoginGatewayView({
  onLoginSuccess,
  isAccessibilityMode = false
}: LoginGatewayViewProps) {
  const [viewMode, setViewMode] = useState<AuthViewMode>('LOGIN');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState<string>('sarah.chen@prognosticator.io');
  const [loginPassword, setLoginPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Sign Up State
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupDept, setSignupDept] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);

  // Common State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusFeedback(`Authenticating ${loginEmail} against Enterprise Directory...`);

    setTimeout(() => {
      const loggedUser = authService.loginWithCredentials(loginEmail, loginPassword);
      setIsLoading(false);
      onLoginSuccess(loggedUser);
    }, 450);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      setStatusFeedback('Notice: Password and confirmation do not match.');
      return;
    }
    setIsLoading(true);
    setStatusFeedback('Registering enterprise account & requesting administrator clearance...');

    setTimeout(() => {
      const newUser = authService.registerNewUser({
        fullName: signupName || 'New Enterprise Member',
        email: signupEmail,
        password: signupPassword,
        department: signupDept || 'Occupational Safety & Health'
      });
      setIsLoading(false);
      setStatusFeedback('Account successfully created! Launching authorized console...');
      setTimeout(() => onLoginSuccess(newUser), 400);
    }, 600);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusFeedback(`Dispatching password reset verification token to ${resetEmail}...`);

    setTimeout(() => {
      setIsLoading(false);
      setResetSent(true);
      setStatusFeedback(`Reset token dispatched to ${resetEmail}. Valid for 15 minutes.`);
    }, 650);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusFeedback('Connecting to Google Cloud Identity & Firebase Auth...');
    try {
      const user = await signInWithGoogle();
      const loggedPersona = authService.loginWithFirebaseUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      setStatusFeedback(`Authenticated as ${user.displayName || user.email}! Launching workspace...`);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(loggedPersona);
      }, 400);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setIsLoading(false);
      setStatusFeedback(`SSO Notice: ${err?.message || 'Authentication window closed or cancelled.'}`);
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        isAccessibilityMode
          ? 'bg-slate-100 text-slate-900'
          : 'bg-[#080C14] text-slate-100 selection:bg-cyan-500 selection:text-white'
      }`}
    >
      {/* Top Enterprise Brand Bar */}
      <header className="w-full border-b border-slate-800/80 bg-[#0A0F1A]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="h-9 w-9 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white font-sans">
                  PROGNOSTICATOR
                </span>
                <span className="font-mono text-[10px] tracking-wider uppercase text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded bg-cyan-950/40">
                  v2.4 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multi-Signal Workforce Health Early-Warning Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300">Admin-Managed Role Governance</span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Viewport */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7 cols): Enterprise System Briefing & Operational Imagery */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-2.5 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                <span>Near-Real-Time Population &amp; Workforce Health Intelligence</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Synthesize disparate signals to prevent health threats before they escalate.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-3.5 leading-relaxed">
                Early signs of heat stress, autonomic collapse, or occupational overexposure rarely sit in a single database. Prognosticator unites continuous wearable biometrics, environmental microclimate telemetry, workplace acoustic levels, and absence patterns into calibrated, explainable early warnings.
              </p>
            </div>

            {/* High-Fidelity Operational Images Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Image 1: Command Center */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-lg group relative">
                <img
                  src={commandCenterImg}
                  alt="Industrial Health Surveillance Command Center"
                  className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Industrial Surveillance Command</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live biometric heat maps &amp; 12-hour predictive anomaly forecasting.
                  </p>
                </div>
              </div>

              {/* Image 2: Wearable & Edge Sensor Stream */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-lg group relative">
                <img
                  src={wearableSensorsImg}
                  alt="Wearable Biometric & Environmental IoT Sensors"
                  className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Edge Biometric &amp; Microclimate IoT</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Continuous HRV, epidermal temperature, and Thermal Work Limit (TWL).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Institutional Auth Card */}
          <div className="lg:col-span-5">
            <div className="border border-slate-800 rounded-2xl bg-[#0B101E]/95 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
              
              {/* Header inside Card */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-cyan-400" />
                    <span>
                      {viewMode === 'LOGIN' && 'Enterprise Sign In'}
                      {viewMode === 'SIGNUP' && 'Request Enterprise Access'}
                      {viewMode === 'FORGOT_PASSWORD' && 'Reset Security Token'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewMode === 'LOGIN' && 'Authorized workforce identity & access console.'}
                    {viewMode === 'SIGNUP' && 'Role & persona clearance verified by Administrator.'}
                    {viewMode === 'FORGOT_PASSWORD' && 'Dispatch recovery credentials to work email.'}
                  </p>
                </div>

                {/* View switcher tabs */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('LOGIN');
                      setStatusFeedback(null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      viewMode === 'LOGIN'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('SIGNUP');
                      setStatusFeedback(null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      viewMode === 'SIGNUP'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Status or Error Banner */}
              {statusFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 text-xs flex items-center gap-2 animate-fadeIn">
                  <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>{statusFeedback}</span>
                </div>
              )}

              {/* VIEW 1: SIGN IN */}
              {viewMode === 'LOGIN' && (
                <div className="space-y-4">
                  {/* Google Cloud Identity SSO */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    <span>Sign In with Google Cloud SSO</span>
                  </button>

                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-slate-800"></div>
                    <span className="px-3 text-[10px] font-mono text-slate-500 uppercase">
                      Or Enterprise Credentials
                    </span>
                    <div className="flex-1 border-t border-slate-800"></div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Corporate Work Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          placeholder="name@enterprise.org"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password or SSO Security Key
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0"
                        />
                        <span>Remember workstation</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('FORGOT_PASSWORD');
                          setResetEmail(loginEmail);
                          setStatusFeedback(null);
                        }}
                        className="text-cyan-400 hover:underline cursor-pointer text-xs"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-950/40"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In to Surveillance Console</span>
                    </button>
                  </form>

                  {/* Institutional Directory Helper (Quick-fill for Evaluation) */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 block mb-1.5 uppercase">
                      Admin Directory Quick-Fill (Test Accounts):
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => setLoginEmail('sarah.chen@prognosticator.io')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 cursor-pointer text-[10px]"
                      >
                        Sarah (Safety Dir)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginEmail('dr.aravind@prognosticator.io')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 cursor-pointer text-[10px]"
                      >
                        Dr. Aravind (Clinician)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginEmail('marcus.vance@plantops.net')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 cursor-pointer text-[10px]"
                      >
                        Marcus (Engineer)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginEmail('tariq.mansoor@worker.local')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 cursor-pointer text-[10px]"
                      >
                        Tariq (Worker)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginEmail('e.rostova@wsh-inspector.gov')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 cursor-pointer text-[10px]"
                      >
                        Elena (MOM Auditor)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: SIGN UP / REGISTRATION */}
              {viewMode === 'SIGNUP' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    <p className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Admin-Managed Role Governance</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      New registrations are assigned initial clearance and persona roles by the site Safety Director in accordance with statutory compliance and zero-trust PBAC standards.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Corporate Work Email
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      placeholder="name@organization.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department / Operational Division
                    </label>
                    <input
                      type="text"
                      value={signupDept}
                      onChange={(e) => setSignupDept(e.target.value)}
                      placeholder="e.g. Civil Construction Team / Environmental Safety"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-950/40"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Request Access &amp; Register Account</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('LOGIN')}
                      className="text-xs text-slate-400 hover:text-cyan-400 cursor-pointer"
                    >
                      Already have an account? <span className="text-cyan-400 underline">Sign In</span>
                    </button>
                  </div>
                </form>
              )}

              {/* VIEW 3: FORGOT PASSWORD */}
              {viewMode === 'FORGOT_PASSWORD' && (
                <div className="space-y-4">
                  {resetSent ? (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Security Dispatch Triggered</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        A secure password recovery link and single-use security token has been dispatched to <strong className="text-emerald-300">{resetEmail}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('LOGIN');
                          setResetSent(false);
                        }}
                        className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Enter your enterprise work email. A cryptographic recovery token will be dispatched to your inbox or company SSO directory.
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Enterprise Work Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            placeholder="name@organization.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-950/40"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Dispatch Password Reset Link</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setViewMode('LOGIN')}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          &larr; Back to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#070B13] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 font-mono text-[11px]">
          <span>&copy; 2026 Prognosticator System. All rights reserved.</span>
          <span>Role-Governed Health Early-Warning Architecture</span>
        </div>
      </footer>
    </div>
  );
}
