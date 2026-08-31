import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto grid w-full max-w-6xl gap-6 p-6 md:grid-cols-3">
			<Skeleton className="h-72 rounded-xl md:col-span-2" />
			<Skeleton className="h-72 rounded-xl" />
		</div>
	);
}
