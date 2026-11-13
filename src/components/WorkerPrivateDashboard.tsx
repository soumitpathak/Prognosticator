import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Heart,
  Thermometer,
  Moon,
  Droplets,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Languages,
  UserCheck,
  Building2,
  Globe2
} from 'lucide-react';
import { authService, REGULATORY_FRAMEWORKS } from '../services/authService';
import { UserPersona } from '../types';
import { useTranslation } from '../services/i18nService';
import { crossRoleOperationsService, useCrossRoleOperations } from '../services/crossRoleOperationsService';
import LanguageAutocomplete from './LanguageAutocomplete';

interface WorkerPrivateDashboardProps {
  currentUser?: UserPersona;
  isAccessibilityMode?: boolean;
}

export default function WorkerPrivateDashboard({
  currentUser: propUser,
  isAccessibilityMode = false
}: WorkerPrivateDashboardProps) {
  const currentUser = propUser || authService.getCurrentUser();
  const { t: dict, lang } = useTranslation();
  const t = dict.worker;
  const ops = useCrossRoleOperations();
  const activeBreak = ops.restBreaks.find((b) => b.status !== 'COMPLETED') || null;
  const [hydrationCountdown, setHydrationCountdown] = useState<number>(14 * 60 + 20); // 14 mins
  const [loggedGlasses, setLoggedGlasses] = useState<number>(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setHydrationCountdown((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const framework = REGULATORY_FRAMEWORKS[currentUser.jurisdiction] || REGULATORY_FRAMEWORKS.SINGAPORE_MOM;

  return (
    <div className="space-y-6">
      {/* Worker Language Access Bar with Single-Select Autocomplete */}
      <div className={`rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs border transition-colors ${
        isAccessibilityMode
          ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Languages className={`h-4 w-4 ${isAccessibilityMode ? 'text-purple-700' : 'text-purple-400'}`} />
          <span className={`font-semibold ${isAccessibilityMode ? 'text-slate-900' : 'text-slate-200'}`}>
            {t.languageAccessLabel}
          </span>
        </div>
        <LanguageAutocomplete
          dropDirection="down"
          isAccessibilityMode={isAccessibilityMode}
          idPrefix="worker-landing-lang"
        />
      </div>

      {/* Privacy Guarantee Header */}
      <div className={`rounded-2xl p-5 shadow-lg border transition-colors ${
        isAccessibilityMode
          ? 'bg-white border-emerald-400 text-slate-900'
          : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              isAccessibilityMode
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`text-lg font-bold ${isAccessibilityMode ? 'text-slate-950' : 'text-white'}`}>
                  {t.title}
                </h2>
                <span className={`text-xs font-sans font-medium flex items-center gap-1.5 ${
                  isAccessibilityMode ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  <span aria-hidden="true">&middot;</span>
                  <span>{t.zeroSurveillance}</span>
                </span>
                {currentUser.workforceType === 'MIGRANT_WORKFORCE' && (
                  <span className={`text-xs font-sans font-medium flex items-center gap-1.5 ${
                    isAccessibilityMode ? 'text-purple-800' : 'text-purple-300'
                  }`}>
                    <span aria-hidden="true">&middot;</span>
                    <span>{t.migrantPassBadge}</span>
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${
                isAccessibilityMode ? 'text-slate-800' : 'text-slate-300'
              }`}>
                {t.privacyNotice}
              </p>
              <div className={`text-[11px] mt-1.5 font-medium flex items-center gap-1.5 ${
                isAccessibilityMode ? 'text-emerald-800 font-semibold' : 'text-emerald-400/90'
              }`}>
                <Globe2 className="h-3 w-3" />
                <span>
                  {framework.countryName} ({framework.regulatoryBody.split(' ')[0]}) &middot; {t.statutoryNotice}
                </span>
              </div>
            </div>
          </div>
          <div className={`p-3 rounded-xl text-end shrink-0 border ${
            isAccessibilityMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.loggedWorkerLabel}</p>
            <p className={`text-xs font-mono font-bold ${isAccessibilityMode ? 'text-cyan-800' : 'text-cyan-400'}`}>
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.assignedZoneOrDorm || 'Sector 4 Heavy Works'}</p>
            <p className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 font-mono ${
              isAccessibilityMode ? 'text-emerald-800 font-bold' : 'text-emerald-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isAccessibilityMode ? 'bg-emerald-600' : 'bg-emerald-400'}`}></span> {t.ephemeralKeyActive}
            </p>
          </div>
        </div>
      </div>

      {/* Main Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Autonomic Strain & HRV */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t.autonomicRecovery}</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  58 ms <span className="text-xs text-amber-400 font-medium font-mono">{t.hrvDeltaTag}</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              {t.mildStrainNotice}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[65%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>{t.highStrainLabel}</span>
              <span>{t.nominalRecoveryLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Skin & Thermal Load */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t.skinTemp}</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  37.4°C <span className="text-xs text-amber-400 font-medium font-mono">{t.skinDeltaTag}</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Thermometer className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              {t.skinTempNotice}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full w-[78%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>{t.baselineTempLabel}</span>
              <span className="text-rose-400 font-semibold">{t.exhaustionTempLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Circadian & Fatigue Buffer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t.sleepBufferTitle}</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  6.8 {t.hoursUnit} <span className="text-xs text-emerald-400 font-medium font-mono">{t.restorativeTag}</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Moon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              {t.sleepBufferNotice}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full w-[85%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>{t.sleepDeficitLabel}</span>
              <span className="text-emerald-400 font-semibold">{t.sleepOptimalLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Panels: Hydration & Self-Advocacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hydration Guidance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-cyan-400" />
                {t.hydrationCountdown}
              </span>
              <span className="text-[11px] font-semibold text-amber-400 font-mono tabular-nums">
                {t.twlSevereHeatBadge}
              </span>
            </div>

            <div className="text-4xl font-extrabold font-mono tabular-nums text-cyan-400 my-2 flex items-center justify-center gap-2">
              <Clock className="h-7 w-7 text-cyan-500" />
              {formatTime(hydrationCountdown)}
            </div>
            <p className="text-[11px] text-slate-400">
              {t.hydrationNotice}
            </p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span>{t.loggedToday}</span>
              <strong className="text-cyan-400 font-mono text-sm">{loggedGlasses} / 8</strong>
              <span className="text-[11px] text-slate-400">{t.portionsLabel}</span>
              {loggedGlasses > 0 && (
                <button
                  type="button"
                  onClick={() => setLoggedGlasses((g) => Math.max(0, g - 1))}
                  className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 hover:border-slate-500 cursor-pointer transition"
                  title="Decrement portion"
                >
                  -1
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLoggedGlasses((g) => g + 1)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Droplets className="h-3.5 w-3.5" /> {t.logButton}
            </button>
          </div>
        </div>

        {/* Private Worker Self-Advocacy & Cooldown Request */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-400" /> {t.cooldownTitle}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {t.cooldownDesc}
            </p>
            {activeBreak ? (
              <div className={`p-4 border rounded-xl text-xs flex flex-col gap-3 ${
                isAccessibilityMode
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${isAccessibilityMode ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="font-semibold">{t.breakDispatchedTitle}</strong>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isAccessibilityMode
                          ? 'bg-white border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                      }`}>
                        {activeBreak.ephemeralToken}
                      </span>
                    </div>
                    <span className="block">{t.breakDispatchedDesc}</span>
                    {activeBreak.status === 'HYDRATION_DISPATCHED' && (
                      <div className={`mt-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${
                        isAccessibilityMode
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-semibold'
                          : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
                      }`}>
                        {t.hydrationConfirmedPrefix} {activeBreak.acknowledgedByRole || t.siteMedicalSafetyTeam}.
                      </div>
                    )}
                  </div>
                </div>
                <div className={`pt-2 border-t flex justify-end ${isAccessibilityMode ? 'border-emerald-300' : 'border-emerald-500/20'}`}>
                  <button
                    type="button"
                    onClick={() => crossRoleOperationsService.completeAnonymousBreakRequest(activeBreak.id)}
                    className={`text-[11px] border px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-medium ${
                      isAccessibilityMode
                        ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-400 font-semibold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                    }`}
                  >
                    <span>{t.resumeShiftBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  {t.cooldownHelper}
                </p>
              </div>
            )}
          </div>

          {!activeBreak && (
            <button
              type="button"
              onClick={() =>
                crossRoleOperationsService.submitAnonymousBreakRequest({
                  zoneId: currentUser.assignedZoneOrDorm || 'Sector 4 Heavy Works',
                  language: lang,
                  skinTempC: ops.heatSpikeActive ? 38.2 : 37.4,
                  hrvMs: ops.heatSpikeActive ? 41 : 58
                })
              }
              className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <AlertCircle className="h-4 w-4" /> {t.requestBreakBtn}
            </button>
          )}
        </div>
      </div>

      {/* Jurisdiction-Specific Worker Rights & Dormitory Thermal Protection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <div className="text-xs font-sans text-purple-300 font-bold">
            {t.statutoryHeader} ({framework.countryName})
          </div>
          <div className="font-semibold text-white">{framework.regulatoryBody}</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {framework.migrantWorkforceProtections.middayWorkBanApplies
              ? `${t.middayWorkBanPrefix} ${framework.migrantWorkforceProtections.middayBanHours}`
              : `${t.wbgtRestCyclesPrefix} ${framework.wbgtThresholds.moderateRestMinsPerHour} min/hr, ${framework.wbgtThresholds.highRestMinsPerHour} min/hr, Stop >= ${framework.wbgtThresholds.stopWorkWbgtC}°C`}
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-sans text-cyan-300 font-bold">
            {t.dormitoryHeader}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {framework.migrantWorkforceProtections.dormitoryThermalStandard}
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-sans text-emerald-300 font-bold">
            {t.whistleblowerHeader}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {framework.migrantWorkforceProtections.nonPunitiveFatigueReportingClause}
          </p>
        </div>
      </div>
    </div>
  );
}
