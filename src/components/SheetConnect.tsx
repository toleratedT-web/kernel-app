"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export interface SheetConnectProps {
  connected: boolean;
  connectedEmail: string | null;
  onConnectionChange: () => void;
}

export function SheetConnect({
  connected,
  connectedEmail,
  onConnectionChange,
}: SheetConnectProps) {
  const { toast } = useToast();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnect = () => {
    // Redirect to the Sheets OAuth endpoint
    window.location.href = "/api/sheets/connect";
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetsToken: null,
          sheetsEmail: null,
          sheetsSheetId: null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect Google Sheets");
      }

      toast("Google Sheets disconnected", "success");
      onConnectionChange();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to disconnect",
        "error"
      );
    } finally {
      setDisconnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Google Sheets connected
              </p>
              {connectedEmail && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {connectedEmail}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            loading={disconnecting}
            className="text-red-500 hover:text-red-600"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Connect Google Sheets
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Export receipts to your spreadsheet with one tap
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={handleConnect}>
          Connect
        </Button>
      </div>
    </div>
  );
}
