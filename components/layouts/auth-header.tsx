'use client';

import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/auth-service';

export function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  return (
    <header className="flex justify-end p-4">
      <button
        onClick={handleLogout}
        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
