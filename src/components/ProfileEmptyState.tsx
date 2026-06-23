import React from 'react';

interface ProfileEmptyStateProps {
  message: string;
}

const ProfileEmptyState: React.FC<ProfileEmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
      {message}
    </div>
  );
};

export default ProfileEmptyState;
