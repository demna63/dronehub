import React from 'react';
import { Clock, Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import type { Post } from '../types';

interface PostCardHeaderProps {
  post: Post;
  canManage: boolean;
  activeMenu: string | null;
  onAuthorClick: (event: React.MouseEvent) => void;
  onMenuToggle: (postId: string) => void;
  onEdit: (event: React.MouseEvent) => void;
  onDelete: (event: React.MouseEvent) => void;
}

const PostCardHeader: React.FC<PostCardHeaderProps> = ({
  post,
  canManage,
  activeMenu,
  onAuthorClick,
  onMenuToggle,
  onEdit,
  onDelete,
}) => {
  const relativeTime = post.createdAt?.seconds
    ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: ka })
    : 'ახლახანს';
  const avatarUrl = (post as Post & { authorAvatar?: string }).authorAvatar || post.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`;

  return (
    <div className="p-4 flex items-center justify-between relative z-20">
      <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={onAuthorClick}>
        <img
          src={avatarUrl}
          className="w-8 h-8 rounded-full border border-white/10 bg-slate-800 object-cover"
          alt={post.author}
        />
        <div className="min-w-0">
          <h3 className="font-bold text-white text-sm truncate flex items-center gap-2">
            {post.author}
            {post.category && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-black">
                {post.category}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock size={12} />
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="relative">
          <button
            aria-label="პოსტის მენიუ"
            onClick={(event) => {
              event.stopPropagation();
              onMenuToggle(post.id);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <MoreHorizontal size={20} />
          </button>
          {activeMenu === post.id && (
            <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(event);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/10 transition-colors"
              >
                <Edit2 size={14} /> რედაქტირება
              </button>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(event);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/5"
              >
                <Trash2 size={14} /> წაშლა
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCardHeader;
