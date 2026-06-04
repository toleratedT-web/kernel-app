"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatDateInput } from "@/lib/utils";
import { generateTempId } from "@/lib/utils";
import type { Receipt, ReceiptItem } from "@/types";

export interface ReceiptEditorProps {
  open: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  onSaved: (receipt: Receipt) => void;
}

interface EditableItem {
  tempId: string;
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  category: string | null;
}

export function ReceiptEditor({
  open,
  onClose,
  receipt,
  onSaved,
}: ReceiptEditorProps) {
  const { toast } = useToast();
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (receipt && open) {
      setMerchant(receipt.merchant ?? "");
      setDate(formatDateInput(receipt.date));
      setItems(
        (receipt.items ?? []).map((item: ReceiptItem) => ({
          tempId: generateTempId(),
          name: item.name,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? null,
          totalPrice: item.totalPrice ?? null,
          category: item.category ?? null,
        }))
      );
    }
  }, [receipt, open]);

  const handleSave = async () => {
    if (!receipt) return;
    setSaving(true);

    try {
      const body = {
        merchant: merchant || null,
        date: date || null,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category,
        })),
      };

      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save receipt");
      }

      const json = await res.json();
      toast("Receipt updated!", "success");
      onSaved(json.data as Receipt);
      onClose();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save receipt",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: generateTempId(),
        name: "",
        quantity: 1,
        unitPrice: null,
        totalPrice: null,
        category: null,
      },
    ]);
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const updateItem = (
    tempId: string,
    field: keyof EditableItem,
    value: string | number | null
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  if (!receipt) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Receipt"
      description="Review and correct the extracted data before saving"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Merchant & Date */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Store name"
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Line Items
            </label>
            <Button variant="ghost" size="sm" onClick={addItem}>
              + Add item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.tempId}
                className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(item.tempId, "name", e.target.value)
                    }
                    placeholder="Item name"
                    className="input-field mb-1 text-sm"
                    aria-label="Item name"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "quantity",
                          parseFloat(e.target.value) || 1
                        )
                      }
                      placeholder="Qty"
                      className="input-field w-16 text-sm"
                      aria-label="Quantity"
                      step="any"
                      min="0"
                    />
                    <input
                      type="number"
                      value={item.unitPrice ?? ""}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "unitPrice",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Unit price"
                      className="input-field flex-1 text-sm"
                      aria-label="Unit price"
                      step="0.01"
                      min="0"
                    />
                    <input
                      type="number"
                      value={item.totalPrice ?? ""}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "totalPrice",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Total"
                      className="input-field w-24 text-sm"
                      aria-label="Total price"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.tempId)}
                  className="mt-1 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label={`Remove item ${item.name || "untitled"}`}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">
                No items yet. Click &ldquo;+ Add item&rdquo; to add one.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
