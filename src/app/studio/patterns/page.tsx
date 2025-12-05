"use client";

import { PatternProvider } from "@/components/patterns/pattern-context";
import { PatternLayout } from "@/components/patterns/pattern-layout";

export default function PatternGeneratorPage() {
	return (
		<PatternProvider>
			<PatternLayout />
		</PatternProvider>
	);
}
