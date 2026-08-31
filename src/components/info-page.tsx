import type { ReactNode } from "react";
import { PageContainer } from "@/components/page-container";

export function InfoPage({
	eyebrow,
	title,
	intro,
	children,
}: {
	eyebrow: string;
	title: string;
	intro: string;
	children: ReactNode;
}) {
	return (
		<PageContainer className="py-16 sm:py-24">
			<article className="mx-auto max-w-3xl">
				<p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
					{eyebrow}
				</p>
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					{title}
				</h1>
				<p className="mt-6 text-lg leading-8 text-muted-foreground">{intro}</p>
				<div className="mt-12 space-y-10 text-base leading-7 text-foreground/90">
					{children}
				</div>
			</article>
		</PageContainer>
	);
}

export function InfoSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4">
			<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
			{children}
		</section>
	);
}
