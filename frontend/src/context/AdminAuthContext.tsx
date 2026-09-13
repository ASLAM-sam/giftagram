import React, { createContext, useState, useEffect, useCallback } from 'react';
import { adminAuthService, AdminUser } from '../services/adminAuthService';

export interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial check on mount: verify existing HttpOnly cookie via /api/admin/me
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const user = await adminAuthService.getMe();
        if (isMounted) {
          setAdminUser(user);
        }
      } catch {
        if (isMounted) {
          setAdminUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await adminAuthService.login(username, password);
      setAdminUser(user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminAuthService.logout();
    } finally {
      setAdminUser(null);
    }
  }, []);

  const value: AdminAuthContextType = {
    adminUser,
    isAuthenticated: !!adminUser,
    isLoading,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export { useAdminAuth } from '../hooks/useAdminAuth';
