import React, { useState } from 'react';
import { MedicalDispatchNotification } from '../types';
import {
  Send,
  Radio,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
  Plus,
  Users,
  MapPin,
  Check,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface MedicalDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatches: MedicalDispatchNotification[];
  onTransmitDispatch: (id: string) => void;
  onTransmitAll: () => void;
  onAcknowledgeDispatch: (id: string, notes?: string) => void;
  onStageNewDispatch: (dispatch: Omit<MedicalDispatchNotification, 'id' | 'stagedAt' | 'status'>) => void;
  zoneNames: string[];
}

export default function MedicalDispatchModal({
  isOpen,
  onClose,
  dispatches,
  onTransmitDispatch,
  onTransmitAll,
  onAcknowledgeDispatch,
  onStageNewDispatch,
  zoneNames
}: MedicalDispatchModalProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'new'>('queue');
  const [selectedZone, setSelectedZone] = useState<string>(zoneNames[0] || 'Outdoor-Construction-Sector-4');
  const [recipientRole, setRecipientRole] = useState<string>('On-Site Rapid Cooling Evacuation Team');
  const [contactMethod, setContactMethod] = useState<'SMS' | 'PUSH_RADIO' | 'DUAL_CHANNEL'>('DUAL_CHANNEL');
  const [recipientPhone, setRecipientPhone] = useState<string>('+1 (555) 911-COOL-2');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MODERATE'>('CRITICAL');
  const [messagePayload, setMessagePayload] = useState<string>(
    'DISPATCH DIRECTIVE: Extreme wet-bulb heat index exceedance (44°C). Escort affected cohort to Shaded Shelter C and administer chilled oral electrolyte packs.'
  );

  if (!isOpen) return null;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    onStageNewDispatch({
      alertId: `ALR-${Math.floor(1000 + Math.random() * 9000)}-STG`,
      zone: selectedZone,
      severity,
      recipientRole,
      contactMethod,
      recipientPhone,
      messagePayload
    });
    setActiveTab('queue');
  };

  const stagedCount = dispatches.filter((d) => d.status === 'STAGED').length;
  const transmittedCount = dispatches.filter((d) => d.status === 'TRANSMITTED').length;
  const acknowledgedCount = dispatches.filter((d) => d.status === 'ACKNOWLEDGED_BY_TEAM').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-rose-400">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Automated Protocol Dispatching &amp; Medical Staging
                </h3>
                <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  On-Site Medical Queue
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated SMS &amp; Push alert staging to on-site rapid-cooling liaisons, paramedics, and safety officers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Metrics Strip */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <strong className="text-white">{stagedCount}</strong> Staged in Queue
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <strong className="text-white">{transmittedCount}</strong> Transmitted (En Route)
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <strong className="text-white">{acknowledgedCount}</strong> On-Site Confirmed
            </span>
          </div>

          <div className="flex items-center gap-2">
            {stagedCount > 0 && (
              <button
                onClick={onTransmitAll}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Transmit All Staged ({stagedCount})</span>
              </button>
            )}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'queue' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dispatch Queue
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
                  activeTab === 'new' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="h-3 w-3" />
                <span>Stage New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'queue' ? (
            <div className="space-y-3">
              {dispatches.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No medical dispatch notifications staged or transmitted.
                </div>
              ) : (
                dispatches.map((dispatch) => (
                  <div
                    key={dispatch.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-950 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 border ${
                            dispatch.status === 'STAGED'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : dispatch.status === 'TRANSMITTED'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              dispatch.status === 'STAGED'
                                ? 'bg-amber-400'
                                : dispatch.status === 'TRANSMITTED'
                                ? 'bg-cyan-400 animate-pulse'
                                : 'bg-emerald-400'
                            }`}
                          ></span>
                          {dispatch.status.replace(/_/g, ' ')}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            dispatch.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : dispatch.severity === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {dispatch.severity}
                        </span>

                        <span className="font-mono text-xs text-slate-400">{dispatch.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {dispatch.stagedAt}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-cyan-300 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          {dispatch.zone}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-indigo-400" />
                          Target: {dispatch.recipientRole}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                          {dispatch.contactMethod === 'SMS' ? (
                            <PhoneCall className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Radio className="h-3 w-3 text-rose-400" />
                          )}
                          {dispatch.contactMethod} ({dispatch.recipientPhone})
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 mt-2">
                        <p className="font-medium text-slate-300">&ldquo;{dispatch.messagePayload}&rdquo;</p>
                        {dispatch.responderNotes && (
                          <p className="text-[11px] text-emerald-300 mt-1 font-mono">
                            &gt; Responder Note: {dispatch.responderNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-stretch md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                      {dispatch.status === 'STAGED' && (
                        <button
                          onClick={() => onTransmitDispatch(dispatch.id)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Transmit SMS/Push</span>
                        </button>
                      )}

                      {dispatch.status === 'TRANSMITTED' && (
                        <button
                          onClick={() =>
                            onAcknowledgeDispatch(
                              dispatch.id,
                              'On-site paramedic deployed with electrolyte cooling vests.'
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirm On-Site Response</span>
                        </button>
                      )}

                      {dispatch.status === 'ACKNOWLEDGED_BY_TEAM' && (
                        <div className="text-right">
                          <span className="text-emerald-400 font-medium text-xs flex items-center gap-1 justify-end">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed at {dispatch.acknowledgedAt || 'T+2m'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateNew} className="max-w-2xl mx-auto space-y-4 text-xs">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Radio className="h-4 w-4 text-rose-400" /> Stage Manual Medical Dispatch Directive
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Target Facility Zone</label>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      {zoneNames.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Severity Escalation Tier</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="CRITICAL">CRITICAL (Immediate Extraction)</option>
                      <option value="HIGH">HIGH (Targeted Cool-Down)</option>
                      <option value="MODERATE">MODERATE (Precautionary Rest)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Recipient Unit / Role</label>
                    <input
                      type="text"
                      value={recipientRole}
                      onChange={(e) => setRecipientRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Contact Gateway (SMS / Radio)</label>
                    <div className="flex gap-2">
                      <select
                        value={contactMethod}
                        onChange={(e) => setContactMethod(e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                      >
                        <option value="DUAL_CHANNEL">Dual (SMS &amp; Radio)</option>
                        <option value="SMS">SMS Gateway</option>
                        <option value="PUSH_RADIO">Push Radio Channel</option>
                      </select>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Intervention Directive Payload</label>
                  <textarea
                    rows={3}
                    value={messagePayload}
                    onChange={(e) => setMessagePayload(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-md shadow-rose-600/20"
                >
                  Stage in Dispatch Queue
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Azure IoT Hub Webhook Connected (Simulated SMS/Push Relay)</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg transition"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
