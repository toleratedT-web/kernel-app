"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MonthlySummary } from "@/components/MonthlySummary";
import { SpendingChart } from "@/components/SpendingChart";
import { TopMerchants } from "@/components/TopMerchants";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";

interface InsightsData {
  currentMonthTotal: number;
  previousMonthTotal: number | null;
  receiptCount: number;
  monthlyData: Array<{ month: string; total: number }>;
  topMerchants: Array<{ name: string; total: number; count: number }>;
  currency: string;
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all receipts to compute insights client-side
      const res = await fetch("/api/receipts?per_page=100");

      if (!res.ok) {
        throw new Error("Failed to fetch receipt data");
      }

      const json = await res.json();
      const receipts = json.data?.receipts ?? [];

      // Compute insights
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

      // Monthly aggregation
      const monthlyTotals: Record<string, number> = {};
      const merchantTotals: Record<string, { total: number; count: number }> = {};

      let currentMonthTotal = 0;
      let prevMonthTotal = 0;
      let currentMonthCount = 0;

      for (const receipt of receipts) {
        const receiptDate = receipt.date ? receipt.date.slice(0, 7) : null;
        const total = receipt.grandTotal ?? 0;
        const merchant = receipt.merchant || "Unknown";

        // Monthly totals
        if (receiptDate) {
          monthlyTotals[receiptDate] = (monthlyTotals[receiptDate] || 0) + total;
        }

        // Current / previous month
        if (receiptDate === currentMonthKey) {
          currentMonthTotal += total;
          currentMonthCount++;
        } else if (receiptDate === prevMonthKey) {
          prevMonthTotal += total;
        }

        // Merchant totals
        if (!merchantTotals[merchant]) {
          merchantTotals[merchant] = { total: 0, count: 0 };
        }
        merchantTotals[merchant].total += total;
        merchantTotals[merchant].count++;
      }

      // Build monthly data array (last 6 months)
      const monthlyData: Array<{ month: string; total: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyData.push({
          month: key,
          total: monthlyTotals[key] ?? 0,
        });
      }

      // Top merchants sorted
      const topMerchants = Object.entries(merchantTotals)
        .map(([name, info]) => ({ name, ...info }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setData({
        currentMonthTotal,
        previousMonthTotal: prevMonthTotal > 0 ? prevMonthTotal : null,
        receiptCount: currentMonthCount,
        monthlyData,
        topMerchants,
        currency: "GBP",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" label="Loading insights…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
        <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchInsights}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data || data.receiptCount === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Insights
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            See where your money goes
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <svg
            className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-50">
            No data yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Scan some receipts to see your spending insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Insights
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See where your money goes
        </p>
      </div>

      {/* Summary Cards */}
      <MonthlySummary
        currentMonthTotal={data.currentMonthTotal}
        previousMonthTotal={data.previousMonthTotal}
        receiptCount={data.receiptCount}
        currency={data.currency}
      />

      {/* Monthly Spending Chart */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
          Monthly Spending
        </h2>
        <SpendingChart data={data.monthlyData} currency={data.currency} />
      </div>

      {/* Top Merchants */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
          Top Merchants
        </h2>
        <TopMerchants merchants={data.topMerchants} currency={data.currency} />
      </div>
    </div>
  );
}
