"use client";

import { motion } from "framer-motion";
import { Palette, Sparkles, Blocks } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
	{
		icon: Palette,
		title: "Create & Own",
		description:
			"Design themes in the visual studio and inscribe them on-chain as 1Sat Ordinals you truly own.",
		link: "/studio",
		linkText: "Open Studio",
	},
	{
		icon: Sparkles,
		title: "AI-Powered",
		description:
			"Generate themes, fonts, patterns, and wallpapers with AI. Pay per generation in BSV microtransactions.",
		link: "/studio",
		linkText: "Try it free",
	},
	{
		icon: Blocks,
		title: "One-Command Install",
		description:
			"Install any on-chain theme with the standard shadcn CLI. Works across every ShadCN project.",
		link: "/themes",
		linkText: "Browse themes",
	},
];

export function Testimonials() {
	return (
		<section className="py-24">
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-12"
				>
					<p className="font-mono text-sm text-primary mb-2">
						{"// Why Theme Token"}
					</p>
					<h2 className="text-3xl font-bold sm:text-4xl mb-4">
						Own Your Design System
					</h2>
					<p className="text-muted-foreground max-w-xl mx-auto">
						Themes inscribed on Bitcoin are permanent, portable, and tradeable.
					</p>
				</motion.div>

				{/* Highlights Grid */}
				<div className="grid md:grid-cols-3 gap-6">
					{highlights.map((item, index) => (
						<motion.div
							key={item.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.1 }}
						>
							<Card className="h-full bg-card/50 border-border hover:border-primary/30 transition-colors">
								<CardContent className="p-6">
									<div className="mb-4">
										<item.icon className="h-8 w-8 text-primary/70" />
									</div>
									<h3 className="font-semibold text-lg mb-2">{item.title}</h3>
									<p className="text-muted-foreground text-sm mb-4 leading-relaxed">
										{item.description}
									</p>
									<Link
										href={item.link}
										className="text-sm text-primary hover:underline"
									>
										{item.linkText} &rarr;
									</Link>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>

				{/* CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.3 }}
					className="text-center mt-12"
				>
					<Badge variant="outline" className="px-4 py-2">
						<span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
						Themes published on Bitcoin, installed with one command
					</Badge>
				</motion.div>
			</div>
		</section>
	);
}
