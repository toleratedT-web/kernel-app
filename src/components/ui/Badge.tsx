"use client";

import type { ReceiptStatus } from "@/types";

export interface BadgeProps {
  status: ReceiptStatus;
  className?: string;
}

const badgeConfig: Record<
  ReceiptStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "badge-pending",
  },
  edited: {
    label: "Edited",
    className:
      "badge-edited",
  },
  exported: {
    label: "Exported",
    className:
      "badge-exported",
  },
};

export function Badge({ status, className = "" }: BadgeProps) {
  const config = badgeConfig[status];

  return (
    <span className={`${config.className} ${className}`}>{config.label}</span>
  );
}
