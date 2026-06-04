"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Receipt } from "@/types";

export interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="card block transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            {receipt.merchant || "Unknown Merchant"}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {formatDate(receipt.date)}
          </p>
          {receipt.items && receipt.items.length > 0 && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {receipt.items.length} item{receipt.items.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {formatCurrency(receipt.grandTotal, receipt.currency)}
          </span>
          <Badge status={receipt.status} />
        </div>
      </div>
    </Link>
  );
}
