"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
	return (
		<div className="flex min-h-[50vh] items-center justify-center p-6">
			<div
				role="alert"
				className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm"
			>
				<AlertCircle
					aria-hidden="true"
					className="mx-auto mb-4 size-10 text-destructive"
				/>
				<h1 className="text-xl font-semibold">This page couldn&apos;t load</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Your work is still here. Try loading this part of the app again.
				</p>
				<Button className="mt-6" onClick={reset}>
					Try again
				</Button>
			</div>
		</div>
	);
}
