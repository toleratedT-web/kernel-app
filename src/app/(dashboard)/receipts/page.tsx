"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReceiptList } from "@/components/receipts/ReceiptList";
import { ScanButton } from "@/components/receipts/ScanButton";
import { ScanModal } from "@/components/receipts/ScanModal";
import type { Receipt } from "@/types";

export default function ReceiptsPage() {
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);

  const handleScanComplete = useCallback(
    (receipt: Receipt) => {
      setScanOpen(false);
      router.push(`/receipts/${receipt.id}`);
    },
    [router]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Receipts
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage all your scanned receipts
        </p>
      </div>

      <ReceiptList />

      <ScanButton onClick={() => setScanOpen(true)} />

      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScanComplete={handleScanComplete}
      />
    </div>
  );
}
