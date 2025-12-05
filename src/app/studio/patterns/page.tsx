"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PatternProvider } from "@/components/patterns/pattern-context";
import { PatternLayout } from "@/components/patterns/pattern-layout";

function PatternContent() {
	return (
		<PatternProvider>
			<PatternLayout />
		</PatternProvider>
	);
}

export default function PatternGeneratorPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<PatternContent />
		</Suspense>
	);
}
