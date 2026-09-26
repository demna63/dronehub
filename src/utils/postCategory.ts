import type { Post } from '../types';

/**
 * Translation keys for the category ids CreatePostModal writes
 * (`category` = news | fpv | cine, `subCategory` = freestyle | racing | longrange).
 */
const LABEL_KEYS: Readonly<Record<string, string>> = {
  freestyle: 'side_cat_freestyle',
  racing: 'side_cat_racing',
  longrange: 'side_cat_longrange',
  cine: 'discipline_cine',
  news: 'post_cat_news',
  fpv: 'post_cat_fpv',
};

/**
 * The most specific category of a post, as a label.
 *
 * The sub-category wins ("FPV Freestyle" over "FPV"). An id with no known
 * label — legacy data, a category added later — is shown as stored rather
 * than hidden, so the row never loses its category.
 */
export const postCategoryLabel = (
  post: Pick<Post, 'category' | 'subCategory'>,
  t: (key: string) => string,
): string | null => {
  const id = (post.subCategory || post.category || '').trim();
  if (!id) return null;
  const key = LABEL_KEYS[id.toLowerCase()];
  return key ? t(key) : id;
};
