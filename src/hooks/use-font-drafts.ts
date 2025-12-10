"use client";

/**
 * Font Drafts Hook
 *
 * Provides cloud storage integration for uploaded fonts.
 * Handles syncing between local blob URLs (for preview) and cloud storage (for persistence).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useYoursWallet } from "./use-yours-wallet";
import type { DraftMetadata } from "@/lib/storage/types";

export interface FontDraft {
	id: string;
	name: string;
	familyName: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	blobUrl?: string; // Local blob URL for preview
	base64Data?: string; // Loaded from cloud
	createdAt: number;
	expiresAt?: number;
}

export function useFontDrafts() {
	const { addresses, status } = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
	const isConnected = status === "connected";
	const isCloudEnabled = isConnected && !!ordAddress;

	const [drafts, setDrafts] = useState<FontDraft[]>([]);
	const [loading, setLoading] = useState(false);
	const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);
	const hasFetched = useRef(false);

	/**
	 * Fetch font drafts from cloud
	 */
	const fetchDrafts = useCallback(async () => {
		if (!ordAddress) return;

		setLoading(true);
		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type: "font",
			});

			const response = await fetch(`/api/drafts?${params}`);
			if (!response.ok) throw new Error("Failed to fetch drafts");

			const data = await response.json();
			setUsage(data.usage);

			// Convert to FontDraft format
			if (data.drafts && data.drafts.length > 0) {
				const fontDrafts: FontDraft[] = data.drafts.map((draft: DraftMetadata) => {
					// Font-specific data is stored in draft.data
					const fontData = (draft.data || {}) as {
						familyName?: string;
						fileName?: string;
					};
					return {
						id: draft.id,
						name: draft.name,
						familyName: fontData.familyName || draft.name,
						fileName: fontData.fileName || draft.name,
						mimeType: draft.mimeType || "font/woff2",
						sizeBytes: draft.sizeBytes,
						// blobUrl will be created when loading the font
						createdAt: draft.createdAt,
						expiresAt: draft.expiresAt,
					};
				});

				setDrafts(fontDrafts);
			}
		} catch (error) {
			console.error("Failed to fetch font drafts:", error);
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
	 * Save a font to cloud storage
	 */
	const saveDraft = useCallback(
		async (
			base64Data: string,
			familyName: string,
			fileName: string,
			mimeType: string,
			sizeBytes: number,
		): Promise<FontDraft | null> => {
			if (!ordAddress) return null;

			try {
				const response = await fetch("/api/drafts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: ordAddress,
						type: "font",
						name: familyName,
						base64: base64Data,
						mimeType,
						data: {
							familyName,
							fileName,
						},
						metadata: {
							sourceType: "upload",
						},
					}),
				});

				if (!response.ok) {
					const data = await response.json();
					console.warn("Failed to save font draft:", data.error);
					return null;
				}

				const { draft } = await response.json();

				const newDraft: FontDraft = {
					id: draft.id,
					name: draft.name,
					familyName,
					fileName,
					mimeType,
					sizeBytes,
					base64Data,
					createdAt: draft.createdAt,
					expiresAt: draft.expiresAt,
				};

				setDrafts((prev) => [newDraft, ...prev]);

				if (usage) {
					setUsage({ ...usage, count: usage.count + 1 });
				}

				return newDraft;
			} catch (error) {
				console.error("Failed to save font draft:", error);
				return null;
			}
		},
		[ordAddress, usage],
	);

	/**
	 * Delete a font draft
	 */
	const deleteDraft = useCallback(
		async (id: string): Promise<boolean> => {
			if (!ordAddress) return false;

			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type: "font",
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
				console.error("Failed to delete font draft:", error);
				return false;
			}
		},
		[ordAddress, usage],
	);

	/**
	 * Load font data from cloud (for preview)
	 */
	const loadFontData = useCallback(
		async (id: string): Promise<{ base64Data: string; blobUrl: string } | null> => {
			if (!ordAddress) return null;

			// Check if already loaded locally
			const draft = drafts.find((d) => d.id === id);
			if (draft?.base64Data && draft?.blobUrl) {
				return { base64Data: draft.base64Data, blobUrl: draft.blobUrl };
			}

			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type: "font",
				});

				const response = await fetch(`/api/drafts/${id}?${params}`);
				if (!response.ok) return null;

				const { draft: fetchedDraft } = await response.json();

				// Fetch the actual font data from blob URL
				if (fetchedDraft.blobUrl) {
					const fontResponse = await fetch(fetchedDraft.blobUrl);
					const blob = await fontResponse.blob();
					const blobUrl = URL.createObjectURL(blob);

					// Convert to base64
					const base64Data = await new Promise<string>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => {
							const result = reader.result as string;
							resolve(result.split(",")[1]);
						};
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					});

					// Update local state with loaded data
					setDrafts((prev) =>
						prev.map((d) =>
							d.id === id ? { ...d, base64Data, blobUrl } : d,
						),
					);

					return { base64Data, blobUrl };
				}

				return null;
			} catch (error) {
				console.error("Failed to load font data:", error);
				return null;
			}
		},
		[ordAddress, drafts],
	);

	return {
		drafts,
		loading,
		usage,
		isCloudEnabled,
		fetchDrafts,
		saveDraft,
		deleteDraft,
		loadFontData,
	};
}
