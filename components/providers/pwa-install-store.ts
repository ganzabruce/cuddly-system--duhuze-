export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Snapshot = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

let snapshot: Snapshot = { deferredPrompt: null, isInstalled: detectStandalone() };
const listeners = new Set<() => void>();

function setSnapshot(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setSnapshot({ deferredPrompt: e as BeforeInstallPromptEvent, isInstalled: snapshot.isInstalled });
  });
  window.addEventListener("appinstalled", () => {
    setSnapshot({ deferredPrompt: null, isInstalled: true });
  });
}

export function clearDeferredPrompt() {
  setSnapshot({ deferredPrompt: null, isInstalled: snapshot.isInstalled });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Snapshot {
  return snapshot;
}

export function getServerSnapshot(): Snapshot {
  return { deferredPrompt: null, isInstalled: false };
}
