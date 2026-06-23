export interface RankTier {
  id: string;
  title: string;
  minXp: number;
  icon: string;
  color: string;
  bg: string;
  border: string;
  shadow: string;
}

export const RANKS: RankTier[] = [
  { 
    id: 'cadet', 
    title: 'Cadet', 
    minXp: 0, 
    icon: '🔰', 
    color: 'text-slate-400', 
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    shadow: 'shadow-slate-500/10'
  },
  { 
    id: 'pilot', 
    title: 'Pilot', 
    minXp: 500, 
    icon: '✈️', 
    color: 'text-sky-400', 
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    shadow: 'shadow-sky-500/20'
  },
  { 
    id: 'ace', 
    title: 'Ace', 
    minXp: 1500, 
    icon: '🦅', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    shadow: 'shadow-emerald-500/20'
  },
  { 
    id: 'veteran', 
    title: 'Veteran', 
    minXp: 5000, 
    icon: '🎖️', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    shadow: 'shadow-amber-500/20'
  }
];

export const getRank = (xp: number) => {
  // Find the highest rank where minXp <= xp
  return [...RANKS].reverse().find(r => xp >= r.minXp) || RANKS[0];
};

export const getNextRank = (currentRankId: string) => {
  const index = RANKS.findIndex(r => r.id === currentRankId);
  return RANKS[index + 1] || null;
};

export const getProgressToNextRank = (xp: number) => {
  const currentRank = getRank(xp);
  const nextRank = getNextRank(currentRank.id);

  if (!nextRank) return 100; // Max level reached

  const totalRange = nextRank.minXp - currentRank.minXp;
  const progress = xp - currentRank.minXp;
  
  return Math.min(100, Math.max(0, (progress / totalRange) * 100));
};