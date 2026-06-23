
import React, { useState } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  postId: string;
  onClose: () => void;
  onSubmit: (postId: string, reason: string) => void;
}

const REPORT_REASONS = [
  "სპამი / არასასურველი რეკლამა",
  "შეურაცხყოფა / სიძულვილის ენა",
  "არასწორი კატეგორია",
  "აკრძალული ტექნიკა / DIY აღჭურვილობა",
  "სახიფათო ფრენა",
  "სხვა"
];

const MAX_CHAR_LIMIT = 200;

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, postId, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherText, setOtherText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === "სხვა" ? `სხვა: ${otherText}` : selectedReason;
    if (finalReason) {
      onSubmit(postId, finalReason);
      setSelectedReason("");
      setOtherText("");
    }
  };

  const remainingChars = MAX_CHAR_LIMIT - otherText.length;
  
  // Dynamic color for character count
  const getCounterColor = () => {
    if (remainingChars < 20) return 'text-rose-500 font-black';
    if (remainingChars < 50) return 'text-amber-500 font-bold';
    return 'text-slate-400 font-bold';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-rose-500/20 text-rose-500 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            დარეპორტება
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            დაგვეხმარეთ საზოგადოების უსაფრთხოების დაცვაში. რატომ აფლაგებთ ამ პოსტს?
          </p>

          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedReason === reason 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/5' 
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          {selectedReason === "სხვა" && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <textarea
                autoFocus
                maxLength={MAX_CHAR_LIMIT}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="მოგვაწოდეთ დამატებითი ინფორმაცია..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none min-h-[100px] resize-none transition-all placeholder:text-slate-700"
              />
              <div className={`text-[10px] uppercase tracking-widest text-right transition-colors ${getCounterColor()}`}>
                დარჩენილია {remainingChars} სიმბოლო
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={!selectedReason || (selectedReason === "სხვა" && !otherText.trim())}
              className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all active:scale-95"
            >
              გაგზავნა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
