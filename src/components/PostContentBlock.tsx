import React from 'react';
import type { Post } from '../types';

interface PostContentBlockProps {
  post: Post;
  displayContent: string;
  isExpanded: boolean;
  editingPostId?: string | null;
  editContent?: string;
  isSavingEdit?: boolean;
  onToggleExpand: (postId: string) => void;
  onStartEdit?: (post: Post) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (post: Post) => void;
  onEditContentChange?: (value: string) => void;
}

const PostContentBlock: React.FC<PostContentBlockProps> = ({
  post,
  displayContent,
  isExpanded,
  editingPostId,
  editContent,
  isSavingEdit,
  onToggleExpand,
  onEditContentChange,
  onCancelEdit,
  onSaveEdit,
}) => {
  const content = post.content || '';
  const isEditing = editingPostId === post.id;

  return (
    <div className="px-4 pb-3 cursor-pointer" onClick={() => {
      if (!isEditing) {
        onToggleExpand(post.id);
      }
    }}>
      <h2 className="text-lg font-bold text-white mb-2 group-hover:text-sky-400 transition-colors leading-tight">{post.title}</h2>

      {isEditing ? (
        <div className="space-y-3 mt-2" onClick={(event) => event.stopPropagation()}>
          <textarea
            value={editContent}
            onChange={(event) => onEditContentChange?.(event.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-300 text-sm min-h-[100px] focus:border-sky-500 focus:outline-none custom-scrollbar"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onCancelEdit?.();
              }}
              className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              disabled={isSavingEdit}
            >
              გაუქმება
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onSaveEdit?.(post);
              }}
              className="px-4 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-2"
              disabled={isSavingEdit}
            >
              {isSavingEdit ? 'ინახება...' : 'შენახვა'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{displayContent}</p>
          {content.length > 180 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand(post.id);
              }}
              className="mt-2 text-xs font-black text-sky-500 uppercase tracking-tighter hover:underline"
            >
              {isExpanded ? '[ ნაკლები ]' : '[ მეტის ნახვა ]'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default PostContentBlock;
