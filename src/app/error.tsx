"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-4xl font-bold text-red-600">Something went wrong</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </main>
  );
}
