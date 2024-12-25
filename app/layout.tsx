import type { Metadata } from "next";
import { Geist, Gloria_Hallelujah, Pangolin } from "next/font/google";

import "./globals.css";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import WalletButton from "@/components/wallet-btn";
import Link from "next/link";
import MenuDrawer from "@/components/drawer";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const pangolin = Pangolin({
	weight: "400",
	variable: "--font-pangolin",
	subsets: ["latin"],
});

const gloriaHallelujah = Gloria_Hallelujah({
	weight: "400",
	variable: "--font-gloria-hallelujah",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Create Next App",
	description: "Generated by create next app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<link
				rel="icon"
				href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>"
			/>
			<body
				className={`${geistSans.variable} ${pangolin.variable} ${gloriaHallelujah.variable} antialiased font-handwriting`}
			>
				<Providers>
					<main className="h-dvh overflow-y-auto flex flex-col">
						<div className="h-16 w-full flex items-center justify-between px-6 my-4 sm:mb-0">
							<Link href="/">
								<div className="flex items-center space-x-1.5">
									<p className="text-4xl">💰</p>

									<h1 className="text-2xl font-bold font-logo">reSOLution</h1>
								</div>
							</Link>
							<MenuDrawer />
							<div className="hidden sm:flex items-center space-x-8">
								<Link href="/how">
									<p className="text-muted-foreground hover:underline hover:text-primary transition-all">
										How does it work?
									</p>
								</Link>
								<Link
									href="https://github.com/sayantank/reSOLution"
									target="_blank"
								>
									<p className="text-muted-foreground hover:underline hover:text-primary transition-all">
										Github
									</p>
								</Link>
								<WalletButton />
							</div>
						</div>
						<div className="flex-1">{children}</div>
						<div className="flex justify-center mt-8 mb-2">
							<p>
								something by{" "}
								<Link href="https://x.com/sayantanxyz" target="_blank">
									<span className="hover:underline hover:font-medium ">
										sayantan ㋡
									</span>
								</Link>
							</p>
						</div>
					</main>
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}
