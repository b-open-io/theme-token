"use client";

import { motion } from "framer-motion";
import { Quote, ExternalLink, Palette } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Testimonial {
	quote: string;
	author: string;
	role: string;
	avatar?: string;
	themeLink?: string;
	themeName?: string;
}

const testimonials: Testimonial[] = [
	{
		quote:
			"Finally, a way to own my design work on-chain. The CLI integration with ShadCN is seamless - my themes are now permanent.",
		author: "Alex Chen",
		role: "UI Designer",
		themeName: "Midnight Aurora",
		themeLink: "/themes",
	},
	{
		quote:
			"I've sold 3 themes on the marketplace already. The royalty system means I earn every time someone uses my work.",
		author: "Sarah Kim",
		role: "Design Engineer",
		themeName: "Coral Sunset",
		themeLink: "/themes",
	},
	{
		quote:
			"Cross-app theming is the future. I bought one theme and use it across all my ShadCN projects. Worth every sat.",
		author: "Marcus Johnson",
		role: "Full-Stack Developer",
		themeName: "Ocean Depths",
		themeLink: "/themes",
	},
];

export function Testimonials() {
	return (
		<section className="py-24 border-t border-border">
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-12"
				>
					<p className="font-mono text-sm text-primary mb-2">
						{"// What creators are saying"}
					</p>
					<h2 className="text-3xl font-bold sm:text-4xl mb-4">
						Built by Designers, for Designers
					</h2>
					<p className="text-muted-foreground max-w-xl mx-auto">
						Join the growing community of creators publishing themes on Bitcoin.
					</p>
				</motion.div>

				{/* Testimonials Grid */}
				<div className="grid md:grid-cols-3 gap-6">
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={testimonial.author}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.1 }}
						>
							<Card className="h-full bg-card/50 border-border hover:border-primary/30 transition-colors">
								<CardContent className="p-6">
									{/* Quote Icon */}
									<div className="mb-4">
										<Quote className="h-8 w-8 text-primary/30" />
									</div>

									{/* Quote Text */}
									<blockquote className="text-foreground/90 mb-6 leading-relaxed">
										"{testimonial.quote}"
									</blockquote>

									{/* Author Info */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10 border border-border">
												{testimonial.avatar ? (
													<AvatarImage
														src={testimonial.avatar}
														alt={testimonial.author}
													/>
												) : null}
												<AvatarFallback className="bg-primary/10 text-primary text-sm">
													{testimonial.author
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className="font-medium text-sm">
													{testimonial.author}
												</div>
												<div className="text-xs text-muted-foreground">
													{testimonial.role}
												</div>
											</div>
										</div>

										{/* Theme Link */}
										{testimonial.themeName && testimonial.themeLink && (
											<Link
												href={testimonial.themeLink}
												className="flex items-center gap-1 text-xs text-primary hover:underline"
											>
												<Palette className="h-3 w-3" />
												{testimonial.themeName}
											</Link>
										)}
									</div>
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
						Join 25+ designers publishing themes on Bitcoin
					</Badge>
				</motion.div>
			</div>
		</section>
	);
}
