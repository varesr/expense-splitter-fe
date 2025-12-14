import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-stone-900 dark:text-stone-50">Expense Splitter</h1>
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/transactions"
            className="rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:dark:border-primary-700 hover:dark:bg-primary-900/20"
          >
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
              Transactions <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
            </h2>
            <p className="mt-2 text-sm opacity-70 text-stone-700 dark:text-stone-300">View and manage your transactions</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
