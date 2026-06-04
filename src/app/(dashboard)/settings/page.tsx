"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SheetConnect } from "@/components/billing/SheetConnect";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { TIERS } from "@/lib/constants";
import type { Tier } from "@/types";

interface ProfileData {
  id: string;
  email: string | null;
  displayName: string | null;
  tier: Tier;
  trialEndsAt: string | null;
  sheetsConnected: boolean;
  sheetsEmail: string | null;
  sheetsSheetId: string | null;
  baseCurrency: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("GBP");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get profile from user API
      const userRes = await fetch("/api/user");
      if (!userRes.ok) throw new Error("Failed to fetch profile");
      const userJson = await userRes.json();

      const p = userJson.data as ProfileData;
      setProfile(p);
      setDisplayName(p.displayName ?? "");
      setBaseCurrency(p.baseCurrency ?? "GBP");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;
    setSaving(true);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          baseCurrency,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to save profile");
      }

      toast("Profile updated!", "success");
      fetchProfile();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save profile",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete all your receipts and data. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      // For MVP, we redirect to a support email since deletion requires
      // admin intervention (deleting auth user + storage + all data)
      toast(
        "Account deletion is not yet available. Please contact support.",
        "info"
      );
    } catch {
      // noop
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" label="Loading settings…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
        <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchProfile}>
          Try again
        </Button>
      </div>
    );
  }

  const currentTierInfo = profile ? TIERS[profile.tier] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account and connected services
        </p>
      </div>

      {/* Profile */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Profile
          </h2>

          <div className="card space-y-4">
            <Input
              label="Email"
              type="email"
              value={profile?.email ?? ""}
              disabled
              hint="Email cannot be changed"
            />

            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Base currency
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="input-field"
                aria-label="Base currency"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={saving}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Google Sheets Connect */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
          Google Sheets Export
        </h2>

        <SheetConnect
          connected={profile?.sheetsConnected ?? false}
          connectedEmail={profile?.sheetsEmail ?? null}
          onConnectionChange={fetchProfile}
        />
      </div>

      {/* Billing Overview */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
          Subscription
        </h2>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {currentTierInfo?.label ?? "Free"} plan
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentTierInfo?.monthlyReceiptLimit ?? 10} receipts per month
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/billing")}
            >
              Manage
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>

        <div className="card border-red-200 dark:border-red-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Delete account
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
