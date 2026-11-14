import React, { useState, useMemo } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  LogIn,
  Send,
  Radio,
  Info
} from 'lucide-react';
import { UserPersona } from '../types';
import { authService } from '../services/authService';
import { signInWithGoogle } from '../services/firebase';
import { useTranslation } from '../services/i18nService';
import { calculateHeatIndex } from '../services/whatIfSimulationEngine';
import { defaultKalman } from '../services/kalmanFilter';
import { computeLstmReconstructionAnomaly } from '../services/lstmAnomalyEngine';
import LanguageAutocomplete from './LanguageAutocomplete';

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
  const { t, langOption } = useTranslation();
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
  const [isErrorFeedback, setIsErrorFeedback] = useState<boolean>(false);
  const [showSignupNoticeInfo, setShowSignupNoticeInfo] = useState<boolean>(false);
  const [previewSectorIdx, setPreviewSectorIdx] = useState<number>(0);

  const previewTelemetry = useMemo(() => {
    const sectors = [
      {
        label: 'Sector 4 · Foundry',
        tempC: 37.8,
        humidityPct: 68,
        rawHrv: [52, 49, 44, 41, 39],
        skinTemps: [37.4, 37.7, 38.0],
        sleepDeficit: 2.5,
        cohortSize: 22
      },
      {
        label: 'Roofline · Solar',
        tempC: 34.5,
        humidityPct: 58,
        rawHrv: [64, 62, 60, 58, 57],
        skinTemps: [36.9, 37.1, 37.2],
        sleepDeficit: 1.0,
        cohortSize: 16
      },
      {
        label: 'Cooling · Bay B',
        tempC: 26.2,
        humidityPct: 48,
        rawHrv: [72, 74, 71, 73, 75],
        skinTemps: [36.4, 36.5, 36.5],
        sleepDeficit: 0.4,
        cohortSize: 19
      }
    ];
    const active = sectors[previewSectorIdx] || sectors[0];
    const smoothedHrv = defaultKalman.smooth(active.rawHrv);
    const heatIndexC = calculateHeatIndex(active.tempC, active.humidityPct);
    const anomaly = computeLstmReconstructionAnomaly(
      smoothedHrv,
      active.skinTemps,
      heatIndexC,
      active.sleepDeficit
    );
    return { sectors, active, heatIndexC, anomaly };
  }, [previewSectorIdx]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsErrorFeedback(false);
    setStatusFeedback(`Authenticating ${loginEmail} against Enterprise Directory...`);

    setTimeout(() => {
      const loggedUser = authService.loginWithCredentials(loginEmail, loginPassword);
      setIsLoading(false);
      if (!loggedUser) {
        setIsErrorFeedback(true);
        setStatusFeedback(
          `Access Denied: "${loginEmail}" is not registered in the authorized Enterprise Directory. Select a directory account below or request access via Sign Up.`
        );
        return;
      }
      onLoginSuccess(loggedUser);
    }, 350);
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
      <header className={`w-full border-b backdrop-blur-md sticky top-0 z-50 transition-colors ${
        isAccessibilityMode
          ? 'border-slate-300 bg-white/95'
          : 'border-slate-800/80 bg-[#0A0F1A]/95'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <span className={`text-base font-extrabold tracking-tight font-sans whitespace-nowrap ${
              isAccessibilityMode ? 'text-slate-950' : 'text-white'
            }`}>
              PROGNOSTICATOR
            </span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Viewport */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:items-center">
          
          {/* Left Column (7 cols): Enterprise System Briefing, Imagery & Live Signal Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className={`text-xs font-semibold tracking-wide mb-2 ${
                isAccessibilityMode ? 'text-cyan-800' : 'text-cyan-400'
              }`}>
                {t.home.heroKicker}
              </p>
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance ${
                isAccessibilityMode ? 'text-slate-950' : 'text-white'
              }`}>
                {t.home.heroTitle}
              </h1>
              <p className={`text-sm sm:text-base mt-3 leading-relaxed max-w-2xl ${
                isAccessibilityMode ? 'text-slate-700' : 'text-slate-300'
              }`}>
                {t.home.heroDescription}
              </p>
            </div>

            {/* High-Fidelity Operational Images Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Image 1: Command Center */}
              <div className={`border rounded-xl overflow-hidden shadow-sm group ${
                isAccessibilityMode ? 'border-slate-300 bg-white' : 'border-slate-800 bg-slate-900/90'
              }`}>
                <img
                  src={commandCenterImg}
                  alt={t.home.card1Title}
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3">
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${
                    isAccessibilityMode ? 'text-slate-950' : 'text-white'
                  }`}>
                    <Activity className={`h-3.5 w-3.5 shrink-0 ${isAccessibilityMode ? 'text-cyan-700' : 'text-cyan-400'}`} />
                    <span>{t.home.card1Title}</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t.home.card1Desc}
                  </p>
                </div>
              </div>

              {/* Image 2: Wearable & Edge Sensor Stream */}
              <div className={`border rounded-xl overflow-hidden shadow-sm group ${
                isAccessibilityMode ? 'border-slate-300 bg-white' : 'border-slate-800 bg-slate-900/90'
              }`}>
                <img
                  src={wearableSensorsImg}
                  alt={t.home.card2Title}
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3">
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${
                    isAccessibilityMode ? 'text-slate-950' : 'text-white'
                  }`}>
                    <Radio className={`h-3.5 w-3.5 shrink-0 ${isAccessibilityMode ? 'text-emerald-700' : 'text-emerald-400'}`} />
                    <span>{t.home.card2Title}</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t.home.card2Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Edge Signal Computation Preview Strip */}
            <div className={`border rounded-xl p-4 space-y-3 ${
              isAccessibilityMode ? 'border-slate-300 bg-white shadow-xs' : 'border-slate-800 bg-slate-900/70'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className={`text-xs font-bold ${isAccessibilityMode ? 'text-slate-950' : 'text-white'}`}>
                    {t.home.previewTitle}
                  </h2>
                  <p className={`text-[11px] ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t.home.previewDesc}
                  </p>
                </div>
                <div className={`flex items-center p-0.5 rounded-lg border text-[11px] ${
                  isAccessibilityMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  {previewTelemetry.sectors.map((sec, idx) => (
                    <button
                      key={sec.label}
                      type="button"
                      onClick={() => setPreviewSectorIdx(idx)}
                      className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                        previewSectorIdx === idx
                          ? 'bg-cyan-600 text-white font-semibold'
                          : isAccessibilityMode
                          ? 'text-slate-700 hover:text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`grid grid-cols-3 gap-3 pt-2 border-t ${
                isAccessibilityMode ? 'border-slate-200' : 'border-slate-800/80'
              }`}>
                <div>
                  <div className={`text-[11px] ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t.home.previewHeatIndex}
                  </div>
                  <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                    previewTelemetry.heatIndexC >= 40
                      ? isAccessibilityMode ? 'text-rose-700' : 'text-rose-400'
                      : previewTelemetry.heatIndexC >= 34
                      ? isAccessibilityMode ? 'text-amber-700' : 'text-amber-400'
                      : isAccessibilityMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    {previewTelemetry.heatIndexC.toFixed(1)}°C
                  </div>
                </div>

                <div>
                  <div className={`text-[11px] ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t.home.previewMse}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-base font-bold font-mono tabular-nums ${
                      isAccessibilityMode ? 'text-slate-950' : 'text-white'
                    }`}>
                      {previewTelemetry.anomaly.mseScore.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      previewTelemetry.anomaly.riskTier === 'CRITICAL_RISK'
                        ? isAccessibilityMode ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : previewTelemetry.anomaly.riskTier === 'MODERATE_RISK'
                        ? isAccessibilityMode ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : isAccessibilityMode ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {previewTelemetry.anomaly.riskTier.replace('_RISK', '')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className={`text-[11px] ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t.home.previewPrivacy}
                  </div>
                  <div className={`text-xs font-mono tabular-nums font-semibold mt-1 ${
                    isAccessibilityMode ? 'text-cyan-800' : 'text-cyan-300'
                  }`}>
                    N={previewTelemetry.active.cohortSize} (k&ge;12) · &epsilon;=0.5
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Institutional Auth Card */}
          <div className="lg:col-span-5">
            <div className={`border rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md ${
              isAccessibilityMode ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-800 bg-[#0B101E]/95 text-slate-100'
            }`}>
              
              {/* Header inside Card */}
              <div className={`flex items-center justify-between pb-5 border-b mb-5 gap-3 ${
                isAccessibilityMode ? 'border-slate-200' : 'border-slate-800/80'
              }`}>
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${
                    isAccessibilityMode ? 'text-slate-950' : 'text-white'
                  }`}>
                    <Lock className={`h-4 w-4 shrink-0 ${isAccessibilityMode ? 'text-cyan-700' : 'text-cyan-400'}`} />
                    <span>
                      {viewMode === 'LOGIN' && t.home.signInTitle}
                      {viewMode === 'SIGNUP' && t.home.signUpTitle}
                      {viewMode === 'FORGOT_PASSWORD' && t.home.forgotTitle}
                    </span>
                  </h2>
                  <p className={`text-xs mt-0.5 ${isAccessibilityMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {viewMode === 'LOGIN' && t.home.signInSubtitle}
                    {viewMode === 'SIGNUP' && t.home.signUpSubtitle}
                    {viewMode === 'FORGOT_PASSWORD' && t.home.forgotSubtitle}
                  </p>
                </div>

                {/* View switcher tabs */}
                <div className={`flex items-center border rounded-lg p-0.5 text-xs shrink-0 ${
                  isAccessibilityMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('LOGIN');
                      setStatusFeedback(null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
                      viewMode === 'LOGIN'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : isAccessibilityMode
                        ? 'text-slate-700 hover:text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.home.tabSignIn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('SIGNUP');
                      setStatusFeedback(null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
                      viewMode === 'SIGNUP'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : isAccessibilityMode
                        ? 'text-slate-700 hover:text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.home.tabSignUp}
                  </button>
                </div>
              </div>

              {/* Status or Error Banner */}
              {statusFeedback && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn border ${
                    isErrorFeedback
                      ? isAccessibilityMode
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                      : isAccessibilityMode
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-950'
                      : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                  }`}
                >
                  {isErrorFeedback ? (
                    <Shield className={`h-4 w-4 shrink-0 ${isAccessibilityMode ? 'text-rose-700' : 'text-rose-400'}`} />
                  ) : (
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${isAccessibilityMode ? 'text-cyan-700' : 'text-cyan-400'}`} />
                  )}
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
                    className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] border ${
                      isAccessibilityMode
                        ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-100 text-slate-900 border-transparent'
                    }`}
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    <span>{t.home.googleSsoBtn}</span>
                  </button>

                  <div className="flex items-center my-3">
                    <div className={`flex-1 border-t ${isAccessibilityMode ? 'border-slate-200' : 'border-slate-800'}`}></div>
                    <span className={`px-3 text-[10px] font-mono uppercase ${
                      isAccessibilityMode ? 'text-slate-600' : 'text-slate-500'
                    }`}>
                      {t.home.orCredentials}
                    </span>
                    <div className={`flex-1 border-t ${isAccessibilityMode ? 'border-slate-200' : 'border-slate-800'}`}></div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${
                        isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'
                      }`}>
                        {t.home.emailLabel}
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-2.5 h-4 w-4 ${isAccessibilityMode ? 'text-slate-500' : 'text-slate-500'}`} />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          placeholder="name@enterprise.org"
                          className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                            isAccessibilityMode
                              ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-500'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${
                        isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'
                      }`}>
                        {t.home.passwordLabel}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className={`w-full border rounded-lg pl-9 pr-10 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                            isAccessibilityMode
                              ? 'bg-slate-50 border-slate-300 text-slate-950'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-2.5 cursor-pointer ${
                            isAccessibilityMode ? 'text-slate-600 hover:text-slate-950' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between text-xs pt-0.5 ${
                      isAccessibilityMode ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className={`rounded text-cyan-600 focus:ring-0 ${
                            isAccessibilityMode ? 'border-slate-400 bg-white' : 'border-slate-700 bg-slate-950'
                          }`}
                        />
                        <span>{t.home.rememberMe}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('FORGOT_PASSWORD');
                          setResetEmail(loginEmail);
                          setStatusFeedback(null);
                        }}
                        className={`hover:underline cursor-pointer text-xs ${
                          isAccessibilityMode ? 'text-cyan-700 font-semibold' : 'text-cyan-400'
                        }`}
                      >
                        {t.home.forgotLink}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-950/30"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>{t.home.signInSubmitBtn}</span>
                    </button>
                  </form>

                  {/* Institutional Directory Helper (Quick-Fill Authorized Personas) */}
                  <div className={`mt-4 pt-3 border-t ${isAccessibilityMode ? 'border-slate-200' : 'border-slate-800/80'}`}>
                    <div className="flex flex-wrap gap-1.5 font-sans text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('sarah.chen@prognosticator.io');
                          setIsErrorFeedback(false);
                          setStatusFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer text-[11px] font-medium whitespace-nowrap transition ${
                          isAccessibilityMode
                            ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                        }`}
                        title="Lands on Executive Whole-Site Command & Admin RBAC"
                      >
                        {t.home.roleDirectorBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('dr.aravind@prognosticator.io');
                          setIsErrorFeedback(false);
                          setStatusFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer text-[11px] font-medium whitespace-nowrap transition ${
                          isAccessibilityMode
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/30'
                        }`}
                        title="Lands on Occupational Health & Clinical Triage Center"
                      >
                        {t.home.roleClinicianBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('marcus.vance@plantops.net');
                          setIsErrorFeedback(false);
                          setStatusFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer text-[11px] font-medium whitespace-nowrap transition ${
                          isAccessibilityMode
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                        }`}
                        title="Lands on Facility HVAC & Mechanical Reliability Console"
                      >
                        {t.home.roleEngineerBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('e.rostova@wsh-inspector.gov');
                          setIsErrorFeedback(false);
                          setStatusFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer text-[11px] font-medium whitespace-nowrap transition ${
                          isAccessibilityMode
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border-rose-500/30'
                        }`}
                        title="Lands on Statutory Regulatory Compliance & WSH Audit"
                      >
                        {t.home.roleAuditorBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('tariq.mansoor@worker.local');
                          setIsErrorFeedback(false);
                          setStatusFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer text-[11px] font-medium whitespace-nowrap transition ${
                          isAccessibilityMode
                            ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-500/30'
                        }`}
                        title="Lands on Sovereign Worker Shield"
                      >
                        {t.home.roleWorkerBtn}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: SIGN UP / REGISTRATION */}
              {viewMode === 'SIGNUP' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  <div className={`p-3 rounded-lg border text-[11px] relative ${
                    isAccessibilityMode
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    <div className={`font-semibold flex items-center gap-1.5 ${
                      isAccessibilityMode ? 'text-slate-950' : 'text-white'
                    }`}>
                      <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${isAccessibilityMode ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      <span>{t.home.signupNoticeTitle}</span>
                      <div className="inline-flex items-center group">
                        <button
                          type="button"
                          onClick={() => setShowSignupNoticeInfo((prev) => !prev)}
                          onBlur={() => setShowSignupNoticeInfo(false)}
                          aria-label={t.home.signupNoticeDesc}
                          aria-expanded={showSignupNoticeInfo}
                          title={t.home.signupNoticeDesc}
                          className={`p-0.5 rounded-full focus:outline-none cursor-pointer transition-colors ${
                            isAccessibilityMode
                              ? 'text-slate-600 hover:text-cyan-700 focus:text-cyan-700'
                              : 'text-slate-400 hover:text-cyan-400 focus:text-cyan-400'
                          }`}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                        <div
                          role="tooltip"
                          className={`absolute inset-x-0 top-full mt-1.5 p-2.5 rounded-lg border text-[11px] font-normal leading-relaxed shadow-xl z-40 transition-opacity ${
                            isAccessibilityMode
                              ? 'bg-white border-slate-300 text-slate-800'
                              : 'bg-slate-900 border-slate-700 text-slate-200'
                          } ${
                            showSignupNoticeInfo
                              ? 'block opacity-100'
                              : 'hidden group-hover:block group-focus-within:block'
                          }`}
                        >
                          {t.home.signupNoticeDesc}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'}`}>
                      {t.home.fullNameLabel}
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      placeholder={t.home.fullNameLabel}
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                        isAccessibilityMode
                          ? 'bg-slate-50 border-slate-300 text-slate-950'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'}`}>
                      {t.home.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      placeholder="name@organization.com"
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                        isAccessibilityMode
                          ? 'bg-slate-50 border-slate-300 text-slate-950'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'}`}>
                      {t.home.deptLabel}
                    </label>
                    <input
                      type="text"
                      value={signupDept}
                      onChange={(e) => setSignupDept(e.target.value)}
                      placeholder="e.g. Civil Construction Team / Environmental Safety"
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                        isAccessibilityMode
                          ? 'bg-slate-50 border-slate-300 text-slate-950'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'}`}>
                        {t.home.passwordLabel}
                      </label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                          isAccessibilityMode
                            ? 'bg-slate-50 border-slate-300 text-slate-950'
                            : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'}`}>
                        {t.home.confirmPasswordLabel}
                      </label>
                      <input
                        type="password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                          isAccessibilityMode
                            ? 'bg-slate-50 border-slate-300 text-slate-950'
                            : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-950/30"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{t.home.signupSubmitBtn}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('LOGIN')}
                      className={`text-xs cursor-pointer ${
                        isAccessibilityMode ? 'text-slate-700 hover:text-cyan-700' : 'text-slate-400 hover:text-cyan-400'
                      }`}
                    >
                      {t.home.alreadyHaveAccount}{' '}
                      <span className={`underline ${isAccessibilityMode ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}`}>
                        {t.home.tabSignIn}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* VIEW 3: FORGOT PASSWORD */}
              {viewMode === 'FORGOT_PASSWORD' && (
                <div className="space-y-4">
                  {resetSent ? (
                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isAccessibilityMode
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    }`}>
                      <div className={`flex items-center gap-2 font-bold ${isAccessibilityMode ? 'text-slate-950' : 'text-white'}`}>
                        <CheckCircle2 className={`h-4 w-4 ${isAccessibilityMode ? 'text-emerald-700' : 'text-emerald-400'}`} />
                        <span>Security Dispatch Triggered</span>
                      </div>
                      <p className="leading-relaxed">
                        <strong className={isAccessibilityMode ? 'text-emerald-800' : 'text-emerald-300'}>{resetEmail}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('LOGIN');
                          setResetSent(false);
                        }}
                        className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer"
                      >
                        {t.home.backToSignIn}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                      <p className={`text-xs leading-relaxed ${isAccessibilityMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {t.home.forgotDesc}
                      </p>

                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'}`}>
                          {t.home.emailLabel}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            placeholder="name@organization.com"
                            className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition ${
                              isAccessibilityMode
                                ? 'bg-slate-50 border-slate-300 text-slate-950'
                                : 'bg-slate-950 border-slate-800 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-950/30"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{t.home.resetSubmitBtn}</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setViewMode('LOGIN')}
                          className={`text-xs cursor-pointer ${
                            isAccessibilityMode ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.home.backToSignIn}
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

      {/* Enterprise Footer with Single-Select Autocomplete Language Selector */}
      <footer
        dir={langOption.direction}
        className={`w-full border-t py-4 transition-colors ${
          isAccessibilityMode ? 'border-slate-300 bg-slate-200 text-slate-700' : 'border-slate-800/80 bg-[#070B13] text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans">
            <span>{t.home.footerCopyright}</span>
            <span className={`hidden md:inline ${isAccessibilityMode ? 'text-slate-400' : 'text-slate-700'}`} aria-hidden="true">&middot;</span>
            <span className="hidden md:inline">{t.home.footerTagline}</span>
          </div>
          <LanguageAutocomplete
            dropDirection="up"
            isAccessibilityMode={isAccessibilityMode}
            idPrefix="home-footer-lang"
          />
        </div>
      </footer>
    </div>
  );
}
