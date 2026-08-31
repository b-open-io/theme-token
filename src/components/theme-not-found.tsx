import { ArrowLeft, Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ThemeNotFound() {
	return (
		<div className="relative flex min-h-[70vh] w-full flex-1 items-center justify-center overflow-hidden bg-background px-4 py-8">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_55%)] opacity-10" />
			<Card className="relative z-10 max-w-md gap-0 overflow-hidden py-0 shadow-2xl">
				<CardHeader className="gap-0 p-0">
					<Image
						src="/swatchy-not-found.jpeg"
						alt="Swatchy looking for a missing page"
						width={448}
						height={280}
						className="w-full"
						priority
					/>
				</CardHeader>
				<CardContent className="p-6 text-center">
					<h1 className="mb-2 font-mono text-lg font-bold uppercase tracking-widest">
						Page Not Found
					</h1>
					<p className="mb-6 text-sm text-muted-foreground">
						The requested path does not exist. Browse published themes, read the
						protocol, or use the agent index to find the right resource.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
						<Button asChild size="lg" className="gap-2">
							<Link href="/themes">
								<Compass data-icon="inline-start" className="h-4 w-4" />
								Browse Themes
							</Link>
						</Button>
						<Button asChild variant="outline" size="lg" className="gap-2">
							<Link href="/spec">
								<ArrowLeft data-icon="inline-start" className="h-4 w-4" />
								Read the Spec
							</Link>
						</Button>
					</div>
					<p className="mt-4 text-xs text-muted-foreground">
						Agent recovery:{" "}
						<Link href="/llms.txt" className="underline underline-offset-4">
							llms.txt
						</Link>{" "}
						·{" "}
						<Link href="/sitemap.xml" className="underline underline-offset-4">
							sitemap.xml
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
