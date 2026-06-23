import React from 'react';
import { WikiEntry, User } from '../types';
import { ArrowLeft, Calendar, User as UserIcon, BookOpen } from 'lucide-react';
import CommentSection from './CommentSection';

interface WikiSectionProps {
  wiki: WikiEntry;
  onBack: () => void;
  user: User | null;
  onLoginClick: () => void;
  onAddComment: (text: string) => void;
}

const WikiSection: React.FC<WikiSectionProps> = ({ wiki, onBack, user, onLoginClick, onAddComment }) => {
  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="sticky top-[76px] z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-white truncate flex-1">{wiki.title}</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
          <span className="flex items-center gap-1 bg-sky-500/10 text-sky-400 px-2 py-1 rounded">
            <BookOpen size={12} /> {wiki.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} /> Last updated: {wiki.lastUpdated}
          </span>
          <span className="flex items-center gap-1">
            <UserIcon size={12} /> {wiki.author}
          </span>
        </div>

        {wiki.image && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-white/10">
            <img src={wiki.image} alt={wiki.title} className="w-full h-64 object-cover" />
          </div>
        )}

        <article className="prose prose-invert prose-slate max-w-none">
          <p className="lead text-xl text-slate-300 mb-8 font-light">{wiki.excerpt}</p>
          <div className="text-slate-400 space-y-4 whitespace-pre-wrap leading-relaxed">
            {wiki.content}
          </div>
        </article>

        <div className="mt-12 border-t border-white/10 pt-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            Discussion
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-400">
              {wiki.comments?.length || 0}
            </span>
          </h3>
          
          <CommentSection 
            comments={wiki.comments || []}
            user={user}
            onLoginClick={onLoginClick}
            onAddComment={(text) => onAddComment(text)}
            onEditComment={() => {}}
            onVoteComment={() => {}}
            onDeleteComment={() => {}} // <--- დამატებულია Build error-ის მოსაგვარებლად
          />
        </div>
      </div>
    </div>
  );
};

export default WikiSection;