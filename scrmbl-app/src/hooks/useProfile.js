import { useState, useEffect, useRef } from 'react';
import * as api from '../utils/api';
import { DEFAULT_STATE } from '../constants';

/* "Somewhere, CO" is placeholder chrome on a fresh state, not something the
   user told us. It must never reach the server, or every new account would
   publish a fake hometown on its profile. Compared against DEFAULT_STATE
   rather than a copied literal so the two can't drift. */
const realCity = (city) => {
  const trimmed = (city || '').trim();
  return trimmed === DEFAULT_STATE.user.city ? '' : trimmed;
};

// Only the server-owned, editable fields. hue stays local (there's no column
// for it) and handle is server-assigned but never user-editable.
const KEY = (p) => JSON.stringify({
  name: (p?.name || '').trim(),
  city: realCity(p?.city),
  bio: (p?.bio || '').trim(),
});

/**
 * Custom hook to sync the editable profile fields (name, city, bio).
 *
 * Unlike the other sync hooks, this one debounces instead of writing per
 * action: SettingsModal writes into state on every keystroke, so a PUT per
 * edit would be a request per character. The debounce lives here rather than
 * on the sheet's close because Sign out and Load demo close Settings without
 * ever calling its onClose.
 *
 * Also unlike the others, a failed save is not rolled back. Local state is
 * what the user is actively typing into; yanking it out from under them would
 * be worse than being briefly out of sync, and the next edit retries anyway.
 */
export function useProfile(isSignedIn, user, isDemo, setMainState) {
  const [error, setError] = useState(null);

  // Latest local values, readable inside the load effect without making it
  // re-run on every keystroke.
  const localRef = useRef();
  localRef.current = { user, isDemo };

  // The last value known to match the server. Edits are only pushed when the
  // local profile differs from this, so adopting the server's own response
  // doesn't turn around and PUT it straight back. null means "not loaded yet",
  // which also gates the save effect.
  const syncedRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!isSignedIn) {
      syncedRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const server = await api.getProfile();
        if (cancelled) return;

        const local = localRef.current;

        // Same reconciliation as useLogs/useTop: an account signing in for the
        // first time has nothing stored, and adopting that blank would erase
        // whatever Settings had already collected locally.
        const serverBlank = !server.city && !server.bio;
        const localHas = !!(realCity(local.user?.city) || (local.user?.bio || '').trim());

        if (serverBlank && localHas && !local.isDemo) {
          const saved = await api.saveProfile({
            name: local.user.name,
            city: realCity(local.user.city),
            bio: local.user.bio,
          });
          if (cancelled) return;
          syncedRef.current = KEY(saved);
          setMainState(s => ({ ...s, user: { ...s.user, ...saved } }));
        } else {
          syncedRef.current = KEY(server);
          setMainState(s => ({ ...s, user: { ...s.user, ...server } }));
        }

        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load profile:', err);
        setError(err.message);
      }
    })();

    return () => { cancelled = true; };
  }, [isSignedIn, setMainState]);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current === null) return;   // load hasn't landed
    if (isDemo) return;                                      // fixtures, not a real profile
    if (KEY(user) === syncedRef.current) return;             // nothing actually changed
    if (!(user?.name || '').trim()) return;                  // server requires a name

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api.saveProfile({ name: user.name, city: realCity(user.city), bio: user.bio })
        .then((saved) => {
          syncedRef.current = KEY(saved);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to save profile:', err);
          setError(err.message);
        });
    }, 700);

    return () => clearTimeout(timer.current);
  }, [isSignedIn, isDemo, user]);

  return { error };
}
