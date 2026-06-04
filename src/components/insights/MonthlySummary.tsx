"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

export interface MonthlySummaryProps {
  currentMonthTotal: number;
  previousMonthTotal: number | null;
  receiptCount: number;
  currency?: string;
}

export function MonthlySummary({
  currentMonthTotal,
  previousMonthTotal,
  receiptCount,
  currency = "GBP",
}: MonthlySummaryProps) {
  const percentChange =
    previousMonthTotal && previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : null;

  const isUp = percentChange !== null && percentChange > 0;
  const isFlat = percentChange !== null && Math.abs(percentChange) < 1;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total spent */}
      <div className="card">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Total this month
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {formatCurrency(currentMonthTotal, currency)}
        </p>
        {percentChange !== null && (
          <p
            className={`mt-1 text-sm ${
              isFlat
                ? "text-gray-400"
                : isUp
                ? "text-red-500"
                : "text-green-500"
            }`}
          >
            {isFlat
              ? "Same as last month"
              : `${isUp ? "+" : ""}${percentChange.toFixed(1)}% vs last month`}
          </p>
        )}
      </div>

      {/* Receipts scanned */}
      <div className="card">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Receipts scanned
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {receiptCount}
        </p>
        <p className="mt-1 text-sm text-gray-400">This month</p>
      </div>

      {/* Average per receipt */}
      <div className="card">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Avg. per receipt
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {receiptCount > 0
            ? formatCurrency(currentMonthTotal / receiptCount, currency)
            : "—"}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {receiptCount > 0 ? "Across all receipts" : "No receipts yet"}
        </p>
      </div>
    </div>
  );
}
