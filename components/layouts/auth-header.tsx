'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';

export function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.push('/login'),
    });
  };

  return (
    <header className="flex items-center justify-end gap-3 p-4">
      {user?.displayName && (
        <span className="text-sm text-stone-700 dark:text-stone-300">
          {user.displayName}
        </span>
      )}
      <button
        onClick={handleLogout}
        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
