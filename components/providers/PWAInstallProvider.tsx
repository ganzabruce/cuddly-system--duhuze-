"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { clearDeferredPrompt, getServerSnapshot, getSnapshot, subscribe } from "./pwa-install-store";

interface PWAInstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  install: async () => {},
});

export function usePWAInstall() {
  return useContext(PWAInstallContext);
}

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const { deferredPrompt, isInstalled } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    clearDeferredPrompt();
  }, [deferredPrompt]);

  return (
    <PWAInstallContext.Provider value={{ canInstall: !!deferredPrompt, isInstalled, install }}>
      {children}
    </PWAInstallContext.Provider>
  );
}
