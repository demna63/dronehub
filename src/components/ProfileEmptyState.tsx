import React from 'react';

interface ProfileEmptyStateProps {
  message: string;
}

const ProfileEmptyState: React.FC<ProfileEmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-20 text-ink-3 font-bold border-2 border-dashed border-white/5 rounded-2xl">
      {message}
    </div>
  );
};

export default ProfileEmptyState;
