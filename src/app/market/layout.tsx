"use client";

import { ShoppingCart, Tag, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
	{ href: "/market/browse", label: "Browse", icon: ShoppingCart },
	{ href: "/market/my-themes", label: "My Themes", icon: Wallet },
	{ href: "/market/sell", label: "Sell", icon: Tag },
];

export default function MarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isBrowsePage = pathname === "/market/browse" || pathname === "/market";

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
				{/* Tab Navigation - Compact */}
				<nav className="mb-6 inline-flex gap-1 rounded-lg bg-muted p-1">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive =
							pathname === tab.href ||
							(tab.href === "/market/browse" && pathname === "/market");
						return (
							<Link
								key={tab.href}
								href={tab.href}
								className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
									isActive
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								<span className="hidden sm:inline">{tab.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Non-browse pages still get a header */}
				{!isBrowsePage && (
					<div className="mb-6">
						<h1 className="text-2xl font-bold">
							{pathname === "/market/my-themes" && "My Themes"}
							{pathname === "/market/sell" && "Sell Theme"}
						</h1>
					</div>
				)}

				{children}
			</div>
		</div>
	);
}
