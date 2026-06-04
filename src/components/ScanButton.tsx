"use client";

import React from "react";

export interface ScanButtonProps {
  onClick: () => void;
}

/**
 * Floating action button that triggers the scan modal.
 */
export function ScanButton({ onClick }: ScanButtonProps) {
  return (
    <button
      id="scan-button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-kernel-600 text-white shadow-lg transition-all hover:bg-kernel-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-kernel-500 focus:ring-offset-2 active:scale-95"
      aria-label="Scan a new receipt"
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
