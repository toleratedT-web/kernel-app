"use client";

import React from "react";

export interface SpendingChartProps {
  data: Array<{
    month: string;
    total: number;
  }>;
  currency?: string;
  className?: string;
}

/**
 * Simple bar chart built with HTML/CSS — no chart library dependency.
 */
export function SpendingChart({
  data,
  currency = "GBP",
  className = "",
}: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 text-sm text-gray-400 ${className}`}>
        No spending data yet
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-end justify-between gap-2" style={{ minHeight: "160px" }}>
        {data.map((item) => {
          const heightPercent = (item.total / maxTotal) * 100;
          return (
            <div
              key={item.month}
              className="flex flex-1 flex-col items-center gap-1"
            >
              {/* Value label */}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {formatBarCurrency(item.total, currency)}
              </span>

              {/* Bar */}
              <div className="flex w-full items-end justify-center" style={{ height: "120px" }}>
                <div
                  className="w-full max-w-[48px] rounded-t-md bg-kernel-500 transition-all hover:bg-kernel-600"
                  style={{
                    height: `${Math.max(heightPercent, 2)}%`,
                  }}
                  title={`${item.month}: ${formatBarCurrency(item.total, currency)}`}
                />
              </div>

              {/* Month label */}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatMonthLabel(item.month)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatBarCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatMonthLabel(monthKey: string): string {
  try {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-GB", { month: "short" });
  } catch {
    return monthKey;
  }
}
