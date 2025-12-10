"use client";

/**
 * Cloud Storage Hook
 *
 * Provides client-side access to cloud storage APIs for drafts.
 * Requires wallet connection for cloud storage; falls back to localStorage for anonymous users.
 */

import { useCallback, useState } from "react";
import { useYoursWallet } from "./use-yours-wallet";
import type {
	Draft,
	DraftListResponse,
	DraftMetadata,
	DraftType,
} from "@/lib/storage/types";

interface UseCloudStorageOptions {
	type: DraftType;
}

interface CreateDraftInput {
	name: string;
	data?: object;
	base64?: string;
	mimeType?: string;
	metadata?: {
		prompt?: string;
		style?: string;
		provider?: string;
		model?: string;
		aspectRatio?: string;
		sourceType?: "ai" | "upload" | "remix";
		sourceOrigin?: string;
	};
}

export function useCloudStorage({ type }: UseCloudStorageOptions) {
	const { addresses, status } = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
	const isConnected = status === "connected";
	const [drafts, setDrafts] = useState<DraftMetadata[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [usage, setUsage] = useState<DraftListResponse["usage"] | null>(null);

	/**
	 * Fetch drafts from cloud storage
	 */
	const fetchDrafts = useCallback(async () => {
		if (!isConnected || !ordAddress) {
			setDrafts([]);
			return [];
		}

		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type,
			});

			const response = await fetch(`/api/drafts?${params}`);
			if (!response.ok) {
				throw new Error("Failed to fetch drafts");
			}

			const data: DraftListResponse = await response.json();
			setDrafts(data.drafts);
			setUsage(data.usage);
			return data.drafts;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to fetch drafts";
			setError(message);
			return [];
		} finally {
			setLoading(false);
		}
	}, [isConnected, ordAddress, type]);

	/**
	 * Create a new draft
	 */
	const createDraft = useCallback(
		async (input: CreateDraftInput): Promise<Draft | null> => {
			if (!isConnected || !ordAddress) {
				setError("Wallet not connected");
				return null;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/drafts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: ordAddress,
						type,
						...input,
					}),
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || "Failed to create draft");
				}

				const { draft } = await response.json();

				// Update local state
				setDrafts((prev) => [draft, ...prev]);

				return draft;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to create draft";
				setError(message);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[isConnected, ordAddress, type],
	);

	/**
	 * Delete a draft
	 */
	const deleteDraft = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isConnected || !ordAddress) {
				setError("Wallet not connected");
				return false;
			}

			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type,
				});

				const response = await fetch(`/api/drafts/${id}?${params}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					throw new Error("Failed to delete draft");
				}

				// Update local state
				setDrafts((prev) => prev.filter((d) => d.id !== id));

				return true;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to delete draft";
				setError(message);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[isConnected, ordAddress, type],
	);

	/**
	 * Get a single draft
	 */
	const getDraft = useCallback(
		async (id: string): Promise<Draft | null> => {
			if (!isConnected || !ordAddress) {
				return null;
			}

			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type,
				});

				const response = await fetch(`/api/drafts/${id}?${params}`);
				if (!response.ok) {
					return null;
				}

				const { draft } = await response.json();
				return draft;
			} catch {
				return null;
			}
		},
		[isConnected, ordAddress, type],
	);

	/**
	 * Update draft metadata
	 */
	const updateDraft = useCallback(
		async (
			id: string,
			updates: Partial<Pick<DraftMetadata, "name" | "prompt" | "style">>,
		): Promise<DraftMetadata | null> => {
			if (!isConnected || !ordAddress) {
				setError("Wallet not connected");
				return null;
			}

			try {
				const response = await fetch(`/api/drafts/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: ordAddress,
						type,
						...updates,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to update draft");
				}

				const { draft } = await response.json();

				// Update local state
				setDrafts((prev) =>
					prev.map((d) => (d.id === id ? { ...d, ...draft } : d)),
				);

				return draft;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to update draft";
				setError(message);
				return null;
			}
		},
		[isConnected, ordAddress, type],
	);

	return {
		// State
		drafts,
		loading,
		error,
		usage,
		isCloudEnabled: isConnected && !!ordAddress,

		// Actions
		fetchDrafts,
		createDraft,
		deleteDraft,
		getDraft,
		updateDraft,

		// Clear error
		clearError: () => setError(null),
	};
}
