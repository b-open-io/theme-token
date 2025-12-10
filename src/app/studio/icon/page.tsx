"use client";

import { Shapes } from "lucide-react";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty";

export default function IconStudioPage() {
	return (
		<div className="flex min-h-0 flex-1 items-center justify-center p-4">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Shapes />
					</EmptyMedia>
					<EmptyTitle>Icon Studio</EmptyTitle>
					<EmptyDescription>
						Create custom icons for your themes. Coming soon!
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	);
}
