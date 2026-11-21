import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ApiError } from '../../api/client';
import * as api from './api';
import type { Credentials, User } from './types';

interface AuthContextValue {
  // undefined: still asking the server.
  user: User | null | undefined;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // The cookie is invisible to JavaScript, so only the server knows whether
  // there is a session.
  useEffect(() => {
    api.fetchMe().then(setUser, (err: unknown) => {
      if (!(err instanceof ApiError && err.status === 401)) console.error(err);
      setUser(null);
    });
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    setUser(await api.login(credentials));
  }, []);

  const register = useCallback(
    async (credentials: Credentials) => {
      await api.register(credentials);
      await login(credentials);
    },
    [login]
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) throw new Error('useAuth needs an <AuthProvider>.');
  return value;
}
