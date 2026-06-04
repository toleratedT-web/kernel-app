"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ReceiptCard } from "@/components/ReceiptCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Receipt } from "@/types";

interface ReceiptListFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
}

export function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ReceiptListFilters>({
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "20");

      if (filters.search) params.set("search", filters.search);
      if (filters.dateFrom) params.set("date_from", filters.dateFrom);
      if (filters.dateTo) params.set("date_to", filters.dateTo);

      const res = await fetch(`/api/receipts?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to fetch receipts");
      }

      const json = await res.json();
      setReceipts(json.data.receipts ?? []);
      setTotal(json.data.total ?? 0);
      setTotalPages(json.data.totalPages ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setPage(1);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, dateFrom: e.target.value }));
    setPage(1);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, dateTo: e.target.value }));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search by merchant…"
            value={filters.search}
            onChange={handleSearchChange}
            icon={
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            }
          />
        </div>
        <div className="flex gap-2">
          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={handleDateFromChange}
              className="input-field text-sm"
              aria-label="From date"
            />
          </div>
          <div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={handleDateToChange}
              className="input-field text-sm"
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" label="Loading receipts…" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
          <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchReceipts}>
            Try again
          </Button>
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState
          title="No receipts yet"
          description="Scan your first receipt to start tracking your spending."
          actionLabel="Scan a receipt"
          onAction={() => {
            // Will be handled by the ScanButton FAB
            document.getElementById("scan-button")?.click();
          }}
        />
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {total} receipt{total !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
