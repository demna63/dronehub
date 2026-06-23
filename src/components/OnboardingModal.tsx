
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface OnboardingModalProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'experienced' | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = () => {
    if (step === 1 && experienceLevel) {
      setStep(2);
    } else if (step === 2 && interests.length > 0) {
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        experienceLevel: experienceLevel!,
        droneInterests: interests
      };
      await apiService.updateUserProfile(updatedUser.id, updatedUser);
      onComplete(updatedUser);
    } catch (error) {
      console.error("Failed to save profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interest === 'both') {
      setInterests(['fpv', 'cinematic']);
    } else {
      if (interests.includes('fpv') && interests.includes('cinematic')) {
         // If currently 'both', switching to single
         setInterests([interest]);
      } else {
         setInterests([interest]);
      }
    }
  };

  const isBoth = interests.includes('fpv') && interests.includes('cinematic');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative"
      >
        <div className="px-10 pt-10 pb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-[24px] mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight typography-mtavruli">
            {step === 1 ? 'გამოცდილება' : 'ინტერესები'}
          </h2>
          <p className="text-slate-400 text-xs font-bold mt-2 tracking-wide">
            {step === 1 ? 'გთხოვთ მიუთითოთ თქვენი გამოცდილების დონე' : experienceLevel === 'beginner' ? 'რა მიმართულება გაინტერესებთ?' : 'რა ტიპის დრონებს მართავთ?'}
          </p>
        </div>

        <div className="px-10 pb-10 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 gap-4"
              >
                <button
                  onClick={() => setExperienceLevel('beginner')}
                  className={`p-6 rounded-[24px] border-2 transition-all flex items-center gap-4 text-left group ${experienceLevel === 'beginner' ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${experienceLevel === 'beginner' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}>🌱</div>
                  <div>
                    <h3 className="font-black uppercase tracking-widest text-[11px] mb-1 typography-mtavruli">დამწყები</h3>
                    <p className="text-[10px] text-slate-400 font-medium">ახალი ვარ ამ სფეროში / ვსწავლობ</p>
                  </div>
                </button>

                <button
                  onClick={() => setExperienceLevel('experienced')}
                  className={`p-6 rounded-[24px] border-2 transition-all flex items-center gap-4 text-left group ${experienceLevel === 'experienced' ? 'bg-sky-500/10 border-sky-500 text-white' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${experienceLevel === 'experienced' ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-400'}`}>✈️</div>
                  <div>
                    <h3 className="font-black uppercase tracking-widest text-[11px] mb-1 typography-mtavruli">გამოცდილი</h3>
                    <p className="text-[10px] text-slate-400 font-medium">უკვე ვფლობ და ვმართავ დრონს</p>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 gap-3"
              >
                <button
                  onClick={() => toggleInterest('fpv')}
                  className={`p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 text-left ${interests.includes('fpv') && !isBoth ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">🚀</div>
                  <span className="font-black uppercase tracking-widest text-[11px] typography-mtavruli">FPV Drones</span>
                </button>

                <button
                  onClick={() => toggleInterest('cinematic')}
                  className={`p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 text-left ${interests.includes('cinematic') && !isBoth ? 'bg-sky-500/10 border-sky-500 text-white' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg">📸</div>
                  <span className="font-black uppercase tracking-widest text-[11px] typography-mtavruli">Cinematic / Camera</span>
                </button>

                <button
                  onClick={() => toggleInterest('both')}
                  className={`p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 text-left ${isBoth ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg">✨</div>
                  <span className="font-black uppercase tracking-widest text-[11px] typography-mtavruli">Both (ორივე)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handleNext}
            disabled={step === 1 ? !experienceLevel : interests.length === 0 || isSaving}
            className="w-full py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all typography-mtavruli flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'მუშავდება...' : step === 1 ? 'შემდეგი' : 'დასრულება'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
