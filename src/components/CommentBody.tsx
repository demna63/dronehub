import React, { useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { Comment, User } from '../types';
import { canManageComment } from '../utils/authUtils';
import { MAX_COMMENT_LENGTH } from '../services/firestoreRepository';
import { useLanguage } from '../contexts/useLanguage';

interface CommentBodyProps {
  comment: Comment;
  user?: User | null;
  /** True while this comment's own write is in flight. */
  isPending?: boolean;
  onEdit: (commentId: string, text: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
}

/**
 * A comment's text plus the author's edit/delete controls.
 *
 * Shared by every surface that lists comments so the permission gate and the
 * delete confirmation cannot drift apart between them. Deletion is confirmed
 * inline rather than with `window.confirm`, which blocks the whole page.
 */
const CommentBody: React.FC<CommentBodyProps> = ({
  comment,
  user,
  isPending = false,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // A refetch (or another surface's edit) can replace the text under an open
  // editor; resync the draft whenever the editor is closed.
  useEffect(() => {
    if (!isEditing) setDraft(comment.text);
  }, [comment.text, isEditing]);

  const canManage = canManageComment(user, comment);
  const isUnchanged = draft.trim() === comment.text.trim();

  const handleSave = async () => {
    if (!draft.trim() || isUnchanged) {
      setIsEditing(false);
      setDraft(comment.text);
      return;
    }
    const saved = await onEdit(comment.id, draft);
    if (saved) setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft(comment.text);
  };

  if (isEditing) {
    return (
      <div className="mt-1 space-y-2">
        <textarea
          id={`edit-comment-${comment.id}`}
          name="edit-comment-text"
          value={draft}
          maxLength={MAX_COMMENT_LENGTH}
          disabled={isPending}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              handleCancel();
            }
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void handleSave();
            }
          }}
          className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-sm text-white leading-relaxed focus:outline-none focus:border-sky-500/50 min-h-[64px] resize-y disabled:opacity-50"
        />
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wide hover:text-white transition-colors disabled:opacity-40"
          >
            {t('action_cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isPending || !draft.trim()}
            className="text-[10px] font-bold text-sky-400 uppercase tracking-wide hover:text-sky-300 transition-colors disabled:opacity-40"
          >
            {isPending ? t('action_saving') : t('action_save')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className={`text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap ${isPending ? 'opacity-50' : ''}`}>
        {comment.text}
      </p>
      {Boolean(comment.editedAt) && (
        <span className="text-[9px] text-slate-500 uppercase tracking-wide">{t('comment_edited')}</span>
      )}

      {canManage && (
        <div className="absolute top-1.5 right-2 flex items-center gap-1.5">
          {isConfirmingDelete ? (
            <>
              <span className="text-[9px] font-bold text-rose-300 uppercase tracking-wide">{t('delete_question')}</span>
              <button
                type="button"
                aria-label={t('delete_confirm_label')}
                title={t('delete_confirm_yes')}
                disabled={isPending}
                onClick={async () => {
                  const deleted = await onDelete(comment.id);
                  if (!deleted) setIsConfirmingDelete(false);
                }}
                className="p-1 text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-40"
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                aria-label={t('delete_confirm_no_label')}
                title={t('action_cancel')}
                disabled={isPending}
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 opacity-0 focus-within:opacity-100 group-hover/comm:opacity-100 transition-opacity">
              <button
                type="button"
                aria-label={t('comment_edit_label')}
                title={t('action_edit')}
                disabled={isPending}
                onClick={() => setIsEditing(true)}
                className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                aria-label={t('comment_delete_label')}
                title={t('action_delete')}
                disabled={isPending}
                onClick={() => setIsConfirmingDelete(true)}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-40"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CommentBody;
