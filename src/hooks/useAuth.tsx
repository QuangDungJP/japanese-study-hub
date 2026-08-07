import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'moderator' | 'user' | 'teacher' | 'senior_teacher';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isTeacher: boolean;
  isSeniorTeacher: boolean;
  isModeratorOrAdmin: boolean;
  isTeacherOrAbove: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator');
  const isTeacher = roles.includes('teacher');
  const isSeniorTeacher = roles.includes('senior_teacher');
  const isModeratorOrAdmin = isAdmin || isModerator;
  const isTeacherOrAbove = isAdmin || isTeacher || isSeniorTeacher;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => { fetchRoles(session.user.id, session.user.email); }, 0);
        } else {
          setRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRoles(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string, email?: string) => {
    try {
      const userEmail = email || user?.email;
      const SUPER_ADMINS = ['quangdungonline.education@gmail.com', 'thanhhungtran2003@gmail.com'];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      let userRoles = (!error && data) ? data.map(r => r.role as AppRole) : [];

      // Cấp quyền Super Admin toàn quyền nếu là email quản trị hệ thống
      if (userEmail && SUPER_ADMINS.includes(userEmail.toLowerCase())) {
        if (!userRoles.includes('admin')) userRoles.push('admin');
        if (!userRoles.includes('teacher')) userRoles.push('teacher');
      }

      setRoles(userRoles);
    } catch {
      setRoles([]);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, roles,
      isAdmin, isModerator, isTeacher, isSeniorTeacher,
      isModeratorOrAdmin, isTeacherOrAbove,
      signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
