/**
 * Navigation constants shared by the left sidebar and the mobile menu.
 * Kept out of the component files so those export components only
 * (react-refresh/only-export-components).
 */

/**
 * Feed categories shown in the sidebar and the mobile menu. `id` is both the
 * route segment and the facet value — the same ids CreatePostModal writes.
 */
export const SIDEBAR_CATEGORIES = [
  { id: 'freestyle', labelKey: 'side_cat_freestyle' },
  { id: 'racing', labelKey: 'side_cat_racing' },
  { id: 'longrange', labelKey: 'side_cat_longrange' },
  { id: 'cine', labelKey: 'discipline_cine' },
] as const;

/** Row geometry and states shared by every left-sidebar item (F7, F13). */
export const SIDEBAR_ROW =
  'flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-sm transition-colors duration-150';
export const SIDEBAR_ROW_IDLE = 'text-ink-2 hover:bg-white/5';
export const SIDEBAR_ROW_ACTIVE = 'bg-accent-tint text-accent font-bold';
