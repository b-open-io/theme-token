"use client";

/**
 * Pattern Drafts Hook
 *
 * Provides cloud storage integration for pattern SVGs.
 * The pattern-store handles params locally; this hook handles SVG draft persistence.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useYoursWallet } from "./use-yours-wallet";
import type { DraftMetadata } from "@/lib/storage/types";

export interface PatternDraft {
	id: string;
	name: string;
	svg: string;
	prompt?: string;
	createdAt: number;
	expiresAt?: number;
}

export function usePatternDrafts() {
	const { addresses, status } = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
	const isConnected = status === "connected";
	const isCloudEnabled = isConnected && !!ordAddress;

	const [drafts, setDrafts] = useState<PatternDraft[]>([]);
	const [loading, setLoading] = useState(false);
	const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);
	const hasFetched = useRef(false);

	/**
	 * Fetch pattern drafts from cloud
	 */
	const fetchDrafts = useCallback(async () => {
		if (!ordAddress) return;

		setLoading(true);
		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type: "pattern",
			});

			const response = await fetch(`/api/drafts?${params}`);
			if (!response.ok) throw new Error("Failed to fetch drafts");

			const data = await response.json();
			setUsage(data.usage);

			// Convert to PatternDraft format
			if (data.drafts && data.drafts.length > 0) {
				const patternDrafts: PatternDraft[] = await Promise.all(
					data.drafts.map(async (draft: DraftMetadata) => {
						let svg = "";
						if (draft.blobUrl) {
							try {
								const svgResponse = await fetch(draft.blobUrl);
								svg = await svgResponse.text();
							} catch (e) {
								console.warn("Failed to fetch SVG for draft:", draft.id, e);
							}
						}

						return {
							id: draft.id,
							name: draft.name,
							svg,
							prompt: draft.prompt,
							createdAt: draft.createdAt,
							expiresAt: draft.expiresAt,
						};
					}),
				);

				setDrafts(patternDrafts);
			}
		} catch (error) {
			console.error("Failed to fetch pattern drafts:", error);
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
	 * Save a pattern SVG as a draft
	 */
	const saveDraft = useCallback(
		async (svg: string, name: string, prompt?: string): Promise<PatternDraft | null> => {
			if (!ordAddress) return null;

			try {
				const response = await fetch("/api/drafts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: ordAddress,
						type: "pattern",
						name: name || "Untitled Pattern",
						base64: btoa(svg),
						mimeType: "image/svg+xml",
						metadata: {
							prompt,
							sourceType: "ai",
						},
					}),
				});

				if (!response.ok) {
					const data = await response.json();
					console.warn("Failed to save pattern draft:", data.error);
					return null;
				}

				const { draft } = await response.json();

				const newDraft: PatternDraft = {
					id: draft.id,
					name: draft.name,
					svg,
					prompt,
					createdAt: draft.createdAt,
					expiresAt: draft.expiresAt,
				};

				setDrafts((prev) => [newDraft, ...prev]);

				if (usage) {
					setUsage({ ...usage, count: usage.count + 1 });
				}

				return newDraft;
			} catch (error) {
				console.error("Failed to save pattern draft:", error);
				return null;
			}
		},
		[ordAddress, usage],
	);

	/**
	 * Delete a pattern draft
	 */
	const deleteDraft = useCallback(
		async (id: string): Promise<boolean> => {
			if (!ordAddress) return false;

			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type: "pattern",
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
				console.error("Failed to delete pattern draft:", error);
				return false;
			}
		},
		[ordAddress, usage],
	);

	return {
		drafts,
		loading,
		usage,
		isCloudEnabled,
		fetchDrafts,
		saveDraft,
		deleteDraft,
	};
}
