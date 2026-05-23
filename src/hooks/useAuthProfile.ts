import { useCallback, useEffect, useState } from 'react';

import type { Session } from '@supabase/supabase-js';

import { getDisplayNameFromUser } from '../lib/authDisplay';
import { supabase } from '../supabase/client';

export type AuthProfileState = {
  ready: boolean;
  signedIn: boolean;
  displayName: string;
  email: string | null;
};

function sessionToProfile(session: Session | null): AuthProfileState {
  if (!session?.user || session.user.is_anonymous) {
    return {
      ready: true,
      signedIn: false,
      displayName: '',
      email: null,
    };
  }
  const u = session.user;
  const name = getDisplayNameFromUser(u);
  const mail = typeof u.email === 'string' ? u.email.trim() || null : null;
  const displayName = name || mail || '';
  return {
    ready: true,
    signedIn: true,
    displayName,
    email: mail,
  };
}

/** 앱 상단 등에서 로그인 표시명·로그아웃에 사용 */
export function useAuthProfile() {
  const [profile, setProfile] = useState<AuthProfileState>({
    ready: false,
    signedIn: false,
    displayName: '',
    email: null,
  });

  useEffect(() => {
    function apply(session: Session | null) {
      setProfile(sessionToProfile(session));
    }

    void supabase.auth.getSession().then(({ data }) => {
      apply(data.session ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      apply(session ?? null);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...profile, signOut };
}
