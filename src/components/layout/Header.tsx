"use client";

import React from "react";
import { UserMenu } from "@/components/layout/UserMenu";

export interface HeaderProps {
  user: {
    email: string | null;
    displayName: string | null;
  } | null;
  onMenuToggle: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden dark:hover:bg-gray-800 dark:hover:text-gray-300"
        aria-label="Toggle navigation menu"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        {user && <UserMenu email={user.email} displayName={user.displayName} />}
      </div>
    </header>
  );
}
