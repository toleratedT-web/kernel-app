import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-kernel-600">404</h1>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-50">
        Page not found
      </h2>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-primary">
        Go home
      </Link>
    </main>
  );
}
