"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReceiptEditor } from "@/components/receipts/ReceiptEditor";
import { ExportButton } from "@/components/receipts/ExportButton";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Receipt } from "@/types";

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchReceipt = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/receipts/${id}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Receipt not found.");
        }
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to fetch receipt");
      }

      const json = await res.json();
      setReceipt(json.data as Receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handleDelete = async () => {
    if (!receipt) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this receipt? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to delete receipt");
      }

      toast("Receipt deleted", "success");
      router.push("/receipts");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete receipt",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = (updated: Receipt) => {
    setReceipt(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" label="Loading receipt…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading receipt"
        description={error}
        actionLabel="Go back"
        onAction={() => router.push("/receipts")}
      />
    );
  }

  if (!receipt) {
    return (
      <EmptyState
        title="Receipt not found"
        description="This receipt may have been deleted."
        actionLabel="Back to receipts"
        onAction={() => router.push("/receipts")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <button
        onClick={() => router.push("/receipts")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to receipts
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {receipt.merchant || "Unknown Merchant"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatDate(receipt.date)}
            </p>
          </div>
          <Badge status={receipt.status} />
        </div>
      </div>

      {/* Image */}
      {receipt.imageUrl && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <img
            src={receipt.imageUrl}
            alt="Receipt"
            className="max-h-96 w-full object-contain bg-gray-50 dark:bg-gray-900"
          />
        </div>
      )}

      {/* Summary */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Merchant</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {receipt.merchant || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {formatDate(receipt.date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {formatCurrency(receipt.grandTotal, receipt.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Currency</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {receipt.currency || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
          Line Items ({receipt.items?.length ?? 0})
        </h2>

        {receipt.items && receipt.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Item
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                    Qty
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                    Unit Price
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-2 text-gray-900 dark:text-gray-50">
                      {item.name}
                    </td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-400">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-400">
                      {item.unitPrice !== null
                        ? formatCurrency(item.unitPrice, receipt.currency)
                        : "—"}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-50">
                      {item.totalPrice !== null
                        ? formatCurrency(item.totalPrice, receipt.currency)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">
            No line items for this receipt.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <ExportButton receiptId={receipt.id} />

        <Button
          variant="secondary"
          onClick={() => setEditorOpen(true)}
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
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          }
        >
          Edit
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={deleting}
          className="ml-auto"
        >
          Delete
        </Button>
      </div>

      {/* Editor Modal */}
      <ReceiptEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        receipt={receipt}
        onSaved={handleSaved}
      />
    </div>
  );
}
