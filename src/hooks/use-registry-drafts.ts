"use client";

/**
 * Registry Drafts Hook
 *
 * Provides cloud storage integration for generated blocks and components.
 * Handles syncing generated registry items to cloud storage for persistence.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useYoursWallet } from "./use-yours-wallet";
import type { DraftMetadata } from "@/lib/storage/types";

export type RegistryItemType = "registry:block" | "registry:component";

export interface RegistryFile {
	path: string;
	type: string;
	content: string;
	vout?: number;
}

export interface RegistryManifest {
	name: string;
	type: RegistryItemType;
	description: string;
	dependencies: string[];
	registryDependencies: string[];
	files: RegistryFile[];
}

export interface RegistryDraft {
	id: string;
	name: string;
	type: RegistryItemType;
	manifest: RegistryManifest;
	paymentTxid?: string;
	createdAt: number;
	expiresAt?: number;
	status?: "draft" | "inscribed" | "failed";
}

export function useRegistryDrafts() {
	const { addresses, status } = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
	const isConnected = status === "connected";
	const isCloudEnabled = isConnected && !!ordAddress;

	const [drafts, setDrafts] = useState<RegistryDraft[]>([]);
	const [loading, setLoading] = useState(false);
	const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);
	const hasFetched = useRef(false);

	/**
	 * Fetch registry drafts from cloud
	 */
	const fetchDrafts = useCallback(async () => {
		if (!ordAddress) return;

		setLoading(true);
		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type: "registry",
			});

			const response = await fetch(`/api/drafts?${params}`);
			if (!response.ok) throw new Error("Failed to fetch drafts");

			const data = await response.json();
			setUsage(data.usage);

			// Convert to RegistryDraft format
			if (data.drafts && data.drafts.length > 0) {
				const registryDrafts: RegistryDraft[] = data.drafts.map((draft: DraftMetadata) => {
					// Registry-specific data is stored in draft.data
					const registryData = (draft.data || {}) as {
						manifest?: RegistryManifest;
						paymentTxid?: string;
						status?: "draft" | "inscribed" | "failed";
					};

					return {
						id: draft.id,
						name: draft.name,
						type: (registryData.manifest?.type || "registry:block") as RegistryItemType,
						manifest: registryData.manifest as RegistryManifest,
						paymentTxid: registryData.paymentTxid,
						status: registryData.status || "draft",
						createdAt: draft.createdAt,
						expiresAt: draft.expiresAt,
					};
				});

				setDrafts(registryDrafts);
			}
		} catch (error) {
			console.error("Failed to fetch registry drafts:", error);
		} finally {
			setLoading(false);
		}
	}, [ordAddress]);

	// Fetch on wallet connect
	useEffect(() => {
		if (isCloudEnabled && !hasFetched.current) {
			hasFetched.current = true;
			fetchDrafts();
		}
	}, [isCloudEnabled, fetchDrafts]);

	/**
	 * Save a registry item (block or component) as a draft
	 */
	const saveDraft = useCallback(
		async (
			manifest: RegistryManifest,
			paymentTxid?: string,
			status: "draft" | "inscribed" | "failed" = "draft"
		): Promise<RegistryDraft | null> => {
			if (!ordAddress) return null;

			try {
				// Serialize the manifest to JSON
				const manifestJson = JSON.stringify(manifest);

				const response = await fetch("/api/drafts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: ordAddress,
						type: "registry",
						name: manifest.name,
						data: {
							manifest,
							paymentTxid,
							status,
						},
						metadata: {
							sourceType: "ai",
						},
					}),
				});

				if (!response.ok) {
					const data = await response.json();
					console.warn("Failed to save registry draft:", data.error);
					return null;
				}

				const { draft } = await response.json();

				const newDraft: RegistryDraft = {
					id: draft.id,
					name: manifest.name,
					type: manifest.type,
					manifest,
					paymentTxid,
					status,
					createdAt: draft.createdAt,
					expiresAt: draft.expiresAt,
				};

				setDrafts((prev) => [newDraft, ...prev]);

				if (usage) {
					setUsage({ ...usage, count: usage.count + 1 });
				}

				return newDraft;
			} catch (error) {
				console.error("Failed to save registry draft:", error);
				return null;
			}
		},
		[ordAddress, usage],
	);

	/**
	 * Update a draft's status (e.g., after inscription)
	 */
	const updateDraftStatus = useCallback(
		async (id: string, status: "draft" | "inscribed" | "failed"): Promise<boolean> => {
			if (!ordAddress) return false;

			try {
				const draft = drafts.find((d) => d.id === id);
				if (!draft) return false;

				const response = await fetch(`/api/drafts/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: ordAddress,
						type: "registry",
						data: {
							manifest: draft.manifest,
							paymentTxid: draft.paymentTxid,
							status,
						},
					}),
				});

				if (!response.ok) return false;

				setDrafts((prev) =>
					prev.map((d) => (d.id === id ? { ...d, status } : d))
				);

				return true;
			} catch (error) {
				console.error("Failed to update draft status:", error);
				return false;
			}
		},
		[ordAddress, drafts],
	);

	/**
	 * Delete a registry draft
	 */
	const deleteDraft = useCallback(
		async (id: string): Promise<boolean> => {
			if (!ordAddress) return false;

			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type: "registry",
				});

				const response = await fetch(`/api/drafts/${id}?${params}`, {
					method: "DELETE",
				});

				if (!response.ok) return false;

				setDrafts((prev) => prev.filter((d) => d.id !== id));

				if (usage) {
					setUsage({ ...usage, count: Math.max(0, usage.count - 1) });
				}

				return true;
			} catch (error) {
				console.error("Failed to delete registry draft:", error);
				return false;
			}
		},
		[ordAddress, usage],
	);

	/**
	 * Get a specific draft by ID
	 */
	const getDraft = useCallback(
		(id: string): RegistryDraft | undefined => {
			return drafts.find((d) => d.id === id);
		},
		[drafts],
	);

	return {
		drafts,
		loading,
		usage,
		isCloudEnabled,
		fetchDrafts,
		saveDraft,
		updateDraftStatus,
		deleteDraft,
		getDraft,
	};
}
