"use client";

import { motion } from "framer-motion";
import { Palette, Users, Coins, Zap } from "lucide-react";
import Image from "next/image";

interface Stat {
	label: string;
	value: string;
	icon: React.ReactNode;
	description?: string;
}

const stats: Stat[] = [
	{
		label: "Themes Published",
		value: "50+",
		icon: <Palette className="h-5 w-5" />,
		description: "On-chain forever",
	},
	{
		label: "Designers",
		value: "25+",
		icon: <Users className="h-5 w-5" />,
		description: "Creating themes",
	},
	{
		label: "BSV Volume",
		value: "2.5+",
		icon: <Coins className="h-5 w-5" />,
		description: "In sales",
	},
	{
		label: "Instant Install",
		value: "<3s",
		icon: <Zap className="h-5 w-5" />,
		description: "Via CLI",
	},
];

// Partner/infrastructure logos
const partners = [
	{
		name: "1Sat Ordinals",
		logo: "/icon.svg",
		url: "https://1satordinals.com",
	},
	{
		name: "ORDFS",
		logo: null, // Text-only for now
		url: "https://ordfs.network",
	},
	{
		name: "Yours Wallet",
		logo: null,
		url: "https://yours.org",
	},
];

export function StatsBar() {
	return (
		<section className="border-t border-border bg-muted/30">
			<div className="container mx-auto px-4 py-8">
				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
					{stats.map((stat, index) => (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.1 }}
							className="text-center"
						>
							<div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary mb-3">
								{stat.icon}
							</div>
							<div className="text-2xl md:text-3xl font-bold tracking-tight">
								{stat.value}
							</div>
							<div className="text-sm text-muted-foreground mt-1">
								{stat.label}
							</div>
							{stat.description && (
								<div className="text-xs text-muted-foreground/70 mt-0.5">
									{stat.description}
								</div>
							)}
						</motion.div>
					))}
				</div>

				{/* Partner Logos */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ delay: 0.4 }}
					className="mt-8 pt-6 border-t border-border/50"
				>
					<p className="text-xs text-center text-muted-foreground mb-4">
						Powered by
					</p>
					<div className="flex items-center justify-center gap-8 flex-wrap">
						{partners.map((partner) => (
							<a
								key={partner.name}
								href={partner.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
							>
								{partner.logo ? (
									<Image
										src={partner.logo}
										alt={partner.name}
										width={20}
										height={20}
										className="opacity-60 group-hover:opacity-100 transition-opacity"
									/>
								) : null}
								<span className="text-sm font-medium">{partner.name}</span>
							</a>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
