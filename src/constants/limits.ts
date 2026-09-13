/**
 * Client-side mirrors of the caps enforced in firestore.rules.
 *
 * The rules are the real limit — a client is not something an attacker runs.
 * These exist so a legitimate user hits a `maxLength` on the input instead of a
 * bare `permission-denied` from a write they have no way to interpret.
 * Change one, change the other.
 */
export const MESSAGE_MAX_LENGTH = 2000;
export const COMMENT_MAX_LENGTH = 2000;
export const POST_TITLE_MAX_LENGTH = 300;
export const POST_CONTENT_MAX_LENGTH = 20000;
