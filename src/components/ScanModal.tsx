"use client";

import React, { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { UPLOAD } from "@/lib/constants";
import type { Receipt } from "@/types";

export interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onScanComplete: (receipt: Receipt) => void;
}

type ScanState = "idle" | "uploading" | "scanning" | "done" | "error";

export function ScanModal({ open, onClose, onScanComplete }: ScanModalProps) {
  const { toast } = useToast();
  const [state, setState] = useState<ScanState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState("idle");
    setErrorMessage(null);
    setPreviewUrl(null);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      if (!UPLOAD.acceptedMimeTypes.includes(file.type)) {
        setErrorMessage("Unsupported file format. Use JPEG, PNG, or WebP.");
        setState("error");
        return;
      }

      if (file.size > UPLOAD.maxFileSizeBytes) {
        setErrorMessage("Image too large. Maximum size is 10 MB.");
        setState("error");
        return;
      }

      // Show preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setState("uploading");

      try {
        setState("scanning");

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/receipts/scan", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error || "Failed to process receipt. Try a clearer photo."
          );
        }

        const json = await res.json();
        const receipt = json.data as Receipt;

        setState("done");
        toast("Receipt scanned successfully!", "success");

        // Brief delay so user sees success state, then proceed
        setTimeout(() => {
          onScanComplete(receipt);
          reset();
        }, 800);
      } catch (err) {
        setState("error");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [onScanComplete, reset, toast]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Scan a Receipt"
      description="Upload a receipt photo or drag & drop it here"
      size="lg"
    >
      {/* Preview */}
      {previewUrl && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img
            src={previewUrl}
            alt="Receipt preview"
            className="max-h-48 w-full object-contain bg-gray-100 dark:bg-gray-800"
          />
        </div>
      )}

      {/* States */}
      {state === "idle" || state === "error" ? (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-kernel-500 bg-kernel-50 dark:bg-kernel-950"
                : "border-gray-300 dark:border-gray-700"
            } ${state === "error" ? "border-red-300 dark:border-red-700" : ""}`}
          >
            <svg
              className="mb-4 h-10 w-10 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>

            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop your receipt here or click to browse
            </p>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, or WebP &middot; Max 10 MB
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
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
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                }
              >
                Take photo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Choose receipt image file"
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraCapture}
              aria-label="Take a photo of your receipt"
            />
          </div>

          {state === "error" && errorMessage && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
        </>
      ) : state === "uploading" || state === "scanning" ? (
        <div className="flex flex-col items-center py-8">
          <LoadingSpinner
            size="lg"
            label={
              state === "scanning"
                ? "Analysing your receipt with AI…"
                : "Uploading image…"
            }
          />
        </div>
      ) : state === "done" ? (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <svg
              className="h-6 w-6"
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
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Receipt scanned successfully!
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
