import React, { createContext, useState, useCallback, useMemo } from 'react';
import { useUI } from '../hooks/useUI';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface UIContextType {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  isAccountOpen: boolean;
  openAccount: () => void;
  closeAccount: () => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

let toastCounter = 0;

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const openAccount = useCallback(() => setIsAccountOpen(true), []);
  const closeAccount = useCallback(() => setIsAccountOpen(false), []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const value = useMemo(
    () => ({
      isSearchOpen,
      openSearch,
      closeSearch,
      isMobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      isAccountOpen,
      openAccount,
      closeAccount,
      toasts,
      showToast,
      removeToast,
    }),
    [
      isSearchOpen,
      openSearch,
      closeSearch,
      isMobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      isAccountOpen,
      openAccount,
      closeAccount,
      toasts,
      showToast,
      removeToast,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export { useUI };
