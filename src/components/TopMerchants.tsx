"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

export interface TopMerchantsProps {
  merchants: Array<{
    name: string;
    total: number;
    count: number;
  }>;
  currency?: string;
}

export function TopMerchants({
  merchants,
  currency = "GBP",
}: TopMerchantsProps) {
  if (merchants.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
        No merchant data yet
      </div>
    );
  }

  const maxTotal = Math.max(...merchants.map((m) => m.total), 1);

  return (
    <div className="space-y-3">
      {merchants.map((merchant, index) => {
        const widthPercent = (merchant.total / maxTotal) * 100;
        return (
          <div key={merchant.name}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {merchant.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {formatCurrency(merchant.total, currency)}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  ({merchant.count} receipt{merchant.count !== 1 ? "s" : ""})
                </span>
              </div>
            </div>
            {/* Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-kernel-500"
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
