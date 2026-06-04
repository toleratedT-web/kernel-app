"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export interface ExportButtonProps {
  receiptId: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ExportButton({
  receiptId,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
}: ExportButtonProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const res = await fetch(`/api/receipts/${receiptId}/export`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || "Failed to export to Google Sheets."
        );
      }

      toast("Exported to Google Sheets successfully!", "success");

      // Open the sheet in a new tab if URL is available
      if (json.data?.sheetUrl) {
        window.open(json.data.sheetUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "Failed to export. Make sure Google Sheets is connected in Settings.",
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      loading={exporting}
      disabled={disabled}
      className={className}
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
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      }
    >
      {exporting ? "Exporting…" : "Export to Sheets"}
    </Button>
  );
}
