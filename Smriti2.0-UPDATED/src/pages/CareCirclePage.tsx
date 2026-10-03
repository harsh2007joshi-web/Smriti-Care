import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/databaseService';
import { CareCircleMember, CareAlert } from '../types/database.types';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Users, Phone, Heart, ShieldCheck, Bell, CheckCircle2, Edit3, Save, X } from 'lucide-react';

export const CareCirclePage: React.FC = () => {
  const { user, updateCurrentProfile } = useAuth();
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>([]);
  const [alerts, setAlerts] = useState<CareAlert[]>([]);
  const [isEditingCaregiver, setIsEditingCaregiver] = useState(false);
  const [editName, setEditName] = useState(user?.caregiver_name || '');
  const [editMobile, setEditMobile] = useState(user?.caregiver_mobile || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dbService.getCareCircle(user.id).then((members) => {
        // Enforce user's caregiver_name if set
        const updated = members.map((m, idx) => {
          if (idx === 0 && user.caregiver_name) {
            return {
              ...m,
              caregiver_name: user.caregiver_name,
              caregiver_mobile: user.caregiver_mobile || m.caregiver_mobile,
              caregiver_email: `${user.caregiver_name.toLowerCase().replace(/\s+/g, '.')}@caregiver.smriti`,
              relationship: m.relationship || 'Primary Caregiver',
            };
          }
          return m;
        });
        setCareCircle(updated);
      });
      dbService.getCareAlerts(user.id).then(setAlerts);
    }
  }, [user]);

  useEffect(() => {
    if (user?.caregiver_name) {
      setEditName(user.caregiver_name);
    }
    if (user?.caregiver_mobile) {
      setEditMobile(user.caregiver_mobile);
    }
  }, [user]);

  const handleSaveCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    await updateCurrentProfile({
      caregiver_name: editName.trim(),
      caregiver_mobile: editMobile.trim(),
    });

    // Update local state
    setCareCircle((prev) => {
      if (prev.length > 0) {
        const next = [...prev];
        next[0] = {
          ...next[0],
          caregiver_name: editName.trim(),
          caregiver_mobile: editMobile.trim() || next[0].caregiver_mobile,
          caregiver_email: `${editName.trim().toLowerCase().replace(/\s+/g, '.')}@caregiver.smriti`,
        };
        return next;
      }
      return prev;
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditingCaregiver(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
            Connected Care Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            My Care Circle
          </h1>
          <p className="text-sm text-slate-600 font-bold mt-0.5">
            Your trusted family and care team connected to your wellness journey.
          </p>
        </div>
        <button
          onClick={() => setIsEditingCaregiver(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 font-extrabold text-slate-900 shadow-sm active:translate-y-0.5 text-sm"
        >
          <Edit3 className="w-4 h-4 text-teal-700" />
          <span>Update Primary Caregiver</span>
        </button>
      </div>

      <VoiceInstructionBar instructionText="Your care circle shows family members and doctors who support your wellness journey." />

      {/* Edit Caregiver Modal */}
      {isEditingCaregiver && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 max-w-lg w-full shadow-card-solid-lg space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border-2 border-slate-900 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-700" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Update Caregiver Details</h3>
              </div>
              <button
                onClick={() => setIsEditingCaregiver(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 flex items-center justify-center text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="p-6 bg-emerald-100 border-2 border-emerald-600 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <p className="font-extrabold text-emerald-950 text-base">Caregiver details updated across your entire app!</p>
              </div>
            ) : (
              <form onSubmit={handleSaveCaregiver} className="space-y-4">
                <div>
                  <label className="block text-sm font-extrabold text-slate-900 mb-1">
                    Caregiver's Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Omprakash Sahoo"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-slate-900 mb-1">
                    Caregiver's Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    placeholder="e.g. +91 91362 74875"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-base"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-slate-950 shadow-btn-solid active:translate-y-0.5 text-base"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Caregiver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCaregiver(false)}
                    className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-bold text-slate-800 text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Care Circle Members */}
      <div className="space-y-4">
        {careCircle.map((member) => (
          <div
            key={member.id}
            className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-100 border-2 border-slate-900 flex items-center justify-center font-black text-2xl text-rose-900 shrink-0 shadow-sm">
                  {member.caregiver_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {member.caregiver_name || 'Care Team Member'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-900 text-xs font-extrabold border border-rose-300">
                      {member.relationship}
                    </span>
                    {member.caregiver_mobile && (
                      <span className="text-xs text-slate-600 font-bold">
                        {member.caregiver_mobile}
                      </span>
                    )}
                  </div>
                  {member.caregiver_email && (
                    <p className="text-xs text-slate-500 font-medium mt-1">{member.caregiver_email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {member.caregiver_mobile && (
                  <a
                    href={`tel:${member.caregiver_mobile}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-slate-950 shadow-btn-solid active:translate-y-0.5"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Notifications */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-extrabold text-slate-900">Recent Care Updates</h3>
        </div>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200"
            >
              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                alert.severity === 'high' ? 'bg-rose-500' :
                alert.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <div>
                <p className="text-sm font-extrabold text-slate-900">{alert.message}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
