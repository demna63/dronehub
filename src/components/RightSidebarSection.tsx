import React from 'react';

interface RightSidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const RightSidebarSection: React.FC<RightSidebarSectionProps> = ({ title, icon, children, className }) => {
  return (
    <div className={`bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-lg ${className || ''}`}>
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
};

export default RightSidebarSection;
