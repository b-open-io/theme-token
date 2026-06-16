"use server";

import { cookies } from "next/headers";
import {
	createThemeSession,
	THEME_SESSION_COOKIE,
	THEME_SESSION_MAX_AGE_SECONDS,
} from "@/lib/server/get-session-theme";

const COOKIE_OPTIONS = {
	httpOnly: false, // Allow client read for debugging
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	// Set only on first visit (not refreshed each load), so this is a hard
	// window, not a sliding one.
	maxAge: THEME_SESSION_MAX_AGE_SECONDS,
	path: "/",
};

/**
 * Set the session theme cookie
 *
 * Called on first visit to persist the randomly assigned theme.
 */
export async function setSessionTheme(origin: string): Promise<void> {
	const cookieStore = await cookies();
	const session = createThemeSession(origin);

	cookieStore.set(
		THEME_SESSION_COOKIE,
		JSON.stringify(session),
		COOKIE_OPTIONS,
	);
}

/**
 * Clear the session theme cookie
 *
 * Called when user wants to get a new random theme.
 */
export async function clearSessionTheme(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(THEME_SESSION_COOKIE);
}

/**
 * Get the current session theme origin
 */
export async function getSessionThemeOrigin(): Promise<string | null> {
	const cookieStore = await cookies();
	const cookie = cookieStore.get(THEME_SESSION_COOKIE);

	if (!cookie) return null;

	try {
		const session = JSON.parse(cookie.value);
		return session.origin ?? null;
	} catch {
		return null;
	}
}
