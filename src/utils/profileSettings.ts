/** Query flag the account menu uses to open the signed-in pilot's editor. */
export const PROFILE_EDIT_QUERY = 'edit';

export const profileSettingsPath = (userId: string): string =>
  `/u/${userId}?${PROFILE_EDIT_QUERY}=1`;

/**
 * The editor belongs to the signed-in pilot only.
 * `?edit=1` on someone else's profile must not open their settings.
 */
export const shouldOpenProfileEditor = (
  editParam: string | null,
  viewerId: string | null | undefined,
  profileId: string | null | undefined,
): boolean => editParam === '1' && Boolean(viewerId) && viewerId === profileId;
