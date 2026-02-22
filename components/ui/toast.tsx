'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  autoDissmissMs?: number;
}

export function Toast({ message, onDismiss, autoDissmissMs = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDissmissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDissmissMs]);

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="text-white/80 hover:text-white font-bold text-lg leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
