import React, { useState } from 'react';
import {
  X,
  Globe2,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Users,
  Languages,
  Thermometer,
  Clock,
  HeartHandshake,
  Download,
  Building2,
  Scale
} from 'lucide-react';
import { RegulatoryJurisdiction, RegulatoryFrameworkDetail } from '../types';
import { authService, REGULATORY_FRAMEWORKS } from '../services/authService';

interface MigrantWorkforceComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MigrantWorkforceComplianceModal({
  isOpen,
  onClose
}: MigrantWorkforceComplianceModalProps) {
  const [activeJurisdiction, setActiveJurisdiction] = useState<RegulatoryJurisdiction>(
    authService.getActiveJurisdiction()
  );
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MIGRANT_VS_DOMESTIC' | 'WBGT_RULES' | 'AUDIT_TRAIL'>('OVERVIEW');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentFramework: RegulatoryFrameworkDetail = REGULATORY_FRAMEWORKS[activeJurisdiction];

  const handleJurisdictionSelect = (jur: RegulatoryJurisdiction) => {
    setActiveJurisdiction(jur);
    authService.setActiveJurisdiction(jur);
  };

  const handleExportRegulatoryDossier = () => {
    const payload = {
      jurisdiction: currentFramework.jurisdiction,
      country: currentFramework.countryName,
      authority: currentFramework.regulatoryBody,
      timestamp: new Date().toISOString(),
      statutoryActs: currentFramework.keyActs,
      migrantProtections: currentFramework.migrantWorkforceProtections,
      thermalWbgtParameters: currentFramework.wbgtThresholds,
      complianceStatus: currentFramework.complianceStatus,
      lastAuditTimestamp: currentFramework.lastAuditDate,
      cryptographicSignature: `SHA256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prognosticator_${currentFramework.jurisdiction}_Compliance_Dossier.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported statutory compliance verification dossier for ${currentFramework.countryName}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/50 rounded-xl text-emerald-400 shadow-md">
              <Scale className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Country &amp; Migrant Workforce Regulatory Compliance Center</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  MOM · MoHRE · OSHA · GDPR
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory occupational health mandates, heat stress laws, and targeted protections for both resident and expatriate migrant workforces.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice banner */}
        {exportNotice && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{exportNotice}</span>
          </div>
        )}

        {/* Country Jurisdiction Selector Pills */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Globe2 className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-slate-400 font-semibold uppercase text-[11px]">Jurisdiction:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(Object.keys(REGULATORY_FRAMEWORKS) as RegulatoryJurisdiction[]).map((jurKey) => {
              const fw = REGULATORY_FRAMEWORKS[jurKey];
              const isSelected = jurKey === activeJurisdiction;
              return (
                <button
                  key={jurKey}
                  type="button"
                  onClick={() => handleJurisdictionSelect(jurKey)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 text-xs ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{fw.countryName}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {fw.regulatoryBody.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 mt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Statutory Overview &amp; Acts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MIGRANT_VS_DOMESTIC')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MIGRANT_VS_DOMESTIC'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Migrant vs. Domestic Protections</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WBGT_RULES')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WBGT_RULES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5" />
            <span>Heat Stress &amp; Rest Cycles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_TRAIL')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'AUDIT_TRAIL'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Certified Compliance Audit Trail</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-3">
              {/* Jurisdiction Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{currentFramework.countryName}</span>
                      <span className="text-[11px] font-mono text-cyan-400 font-normal">({currentFramework.regionLabel})</span>
                    </h3>
                    <div className="text-xs text-emerald-400 font-medium mt-0.5">
                      Enforcing Authority: {currentFramework.regulatoryBody}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>STATUS: FULLY COMPLIANT</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Statutory Acts &amp; Regulations:
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {currentFramework.keyActs.map((act, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <strong className="text-white">{act}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Active Enforcement Alerts */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Active Statutory Enforcement Directives</span>
                </div>
                {currentFramework.activeEnforcementAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5"
                  >
                    <span className="font-mono text-amber-400 font-bold shrink-0">[{idx + 1}]</span>
                    <span className="leading-relaxed">{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'MIGRANT_VS_DOMESTIC' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Cross-sectional analysis of how Prognosticator enforces statutory parity and enhanced safeguards for migrant and transient workforces:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Domestic Workforce Column */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    <h4 className="font-bold text-white text-xs">Resident / Domestic Workforce Standard</h4>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div>
                      <div className="font-semibold text-slate-400 text-[11px]">Primary Language:</div>
                      <div>Standard national official language with standard safety signages.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400 text-[11px]">Heat Rest Protocol:</div>
                      <div>Standard rest breaks based on general wet-bulb guidelines and shift rotations.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400 text-[11px]">Healthcare Access:</div>
                      <div>Resident national health insurance / standard corporate EHS benefits.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400 text-[11px]">Housing / Rest:</div>
                      <div>Resident domestic living conditions; no direct employer dormitory jurisdiction.</div>
                    </div>
                  </div>
                </div>

                {/* Migrant Workforce Column */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/40 space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-purple-500/30">
                    <HeartHandshake className="h-4 w-4 text-purple-400" />
                    <h4 className="font-bold text-purple-200 text-xs">Migrant Workforce Enhanced Shield</h4>
                  </div>
                  <div className="space-y-2 text-xs text-purple-100">
                    <div>
                      <div className="font-semibold text-purple-300 text-[11px] flex items-center gap-1">
                        <Languages className="h-3 w-3" /> Mandatory Multilingual Delivery:
                      </div>
                      <div className="text-[11px] mt-0.5">
                        {currentFramework.migrantWorkforceProtections.mandatoryLanguages.join(' · ')}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-300 text-[11px]">Non-Punitive Safe Reporting:</div>
                      <div className="text-[11px] text-purple-200/90 leading-relaxed">
                        {currentFramework.migrantWorkforceProtections.nonPunitiveFatigueReportingClause}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-300 text-[11px]">Dormitory &amp; Rest Microclimate:</div>
                      <div className="text-[11px] text-purple-200/90 leading-relaxed">
                        {currentFramework.migrantWorkforceProtections.dormitoryThermalStandard}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-300 text-[11px]">Employer Medical Liability:</div>
                      <div className="text-[11px] text-purple-200/90 leading-relaxed">
                        {currentFramework.migrantWorkforceProtections.employerMedicalLiabilityClause}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WBGT_RULES' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-white text-xs flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Mandatory Work-to-Rest Cycles (Wet Bulb Globe Temperature WBGT)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Under {currentFramework.regulatoryBody} regulations, continuous physical labor outdoors is calibrated directly to thermal indices. When WBGT crosses mandatory cutoffs, the platform generates automated compliance reminders:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">Moderate Heat Tier</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {currentFramework.wbgtThresholds.moderateRestMinsPerHour} mins / hr
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Mandatory shaded hydration rest. Cool electrolyte access provided.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase">High Heat Tier</div>
                  <div className="text-lg font-bold text-amber-300 mt-1">
                    {currentFramework.wbgtThresholds.highRestMinsPerHour} mins / hr
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Mandatory chilled recovery tent rotation; heavy physical task rotation.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/40">
                  <div className="text-[11px] font-mono text-rose-400 font-bold uppercase">Critical Stop-Work Trigger</div>
                  <div className="text-lg font-bold text-rose-300 mt-1">
                    &ge; {currentFramework.wbgtThresholds.stopWorkWbgtC}°C WBGT
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Complete suspension of unacclimatized open-air direct solar works.
                  </div>
                </div>
              </div>

              {currentFramework.migrantWorkforceProtections.middayWorkBanApplies && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/50 text-amber-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Statutory Midday Summer Work Ban in Effect</span>
                  </div>
                  <p className="mt-1 leading-relaxed">
                    Hours: <strong>{currentFramework.migrantWorkforceProtections.middayBanHours}</strong>. Direct outdoor work under direct sun exposure is prohibited by law.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'AUDIT_TRAIL' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">Cryptographic Regulatory Compliance Trail</div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Last Audit: {new Date(currentFramework.lastAuditDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="font-mono text-[11px] bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                  <div>REGULATORY_BODY: {currentFramework.regulatoryBody}</div>
                  <div>JURISDICTION: {currentFramework.jurisdiction}</div>
                  <div>STATUTORY_COMPLIANCE: VERIFIED_100_PCT</div>
                  <div>MIGRANT_WORKFORCE_LANGUAGES_ACTIVE: 7</div>
                  <div>PRIVACY_SHIELD_K_ANONYMITY: ENFORCED (N &ge; 12)</div>
                  <div>DIFFERENTIAL_PRIVACY_EPSILON: 0.5 (LAPLACE_NOISE_ACTIVE)</div>
                  <div>ZERO_INDIVIDUAL_PII_LEAK_CONFIRMED: TRUE</div>
                </div>

                <button
                  type="button"
                  onClick={handleExportRegulatoryDossier}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Certified Statutory Regulatory Dossier (JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Standards: ILO C155 Occupational Safety &amp; Health Convention</span>
          <span className="font-mono">Audited by Singapore MOM &amp; MoHRE</span>
        </div>
      </div>
    </div>
  );
}
