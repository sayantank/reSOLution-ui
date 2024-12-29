"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
	SolflareWalletAdapter,
	PhantomWalletAdapter,
	KeystoneWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SessionPayload } from "@/lib/auth";
import { toast } from "sonner";
import { clusterApiUrl } from "@solana/web3.js";

const queryClient = new QueryClient();

export const cluster = WalletAdapterNetwork.Devnet;

const IRONFORGE_URL = process.env.NEXT_PUBLIC_IRONFORGE_URL!;

export function Providers({
	children,
	session,
}: {
	children: React.ReactNode;
	session: { payload: SessionPayload; token: string };
}) {
	const [hasWarnedSessionExpiry, setHasWarnedSessionExpiry] = useState(false);

	// The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
	const network = cluster;

	// You can also provide a custom RPC endpoint.
	const endpoint = clusterApiUrl(network);

	const wallets = useMemo(
		() => [
			/**
			 * Wallets that implement either of these standards will be available automatically.
			 *
			 *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
			 *     (https://github.com/solana-mobile/mobile-wallet-adapter)
			 *   - Solana Wallet Standard
			 *     (https://github.com/anza-xyz/wallet-standard)
			 *
			 * If you wish to support a wallet that supports neither of those standards,
			 * instantiate its legacy wallet adapter here. Common legacy adapters can be found
			 * in the npm package `@solana/wallet-adapter-wallets`.
			 */
			new SolflareWalletAdapter({ network }),
			new PhantomWalletAdapter({ network }),
			new KeystoneWalletAdapter({ network }),
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[network],
	);

	useEffect(() => {
		const interval = setInterval(() => {
			if (
				new Date(session.payload.expires) < new Date() &&
				!hasWarnedSessionExpiry
			) {
				setHasWarnedSessionExpiry(true);
				toast.warning(
					"Your session has expired. Please refresh the page to continue.",
					{
						dismissible: false,
					},
				);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [session, hasWarnedSessionExpiry]);

	return (
		<ConnectionProvider
			endpoint={endpoint}
			config={{
				fetch: (url, init) =>
					fetch(url, {
						...init,
						headers: {
							...init?.headers,
							Authorization: `Bearer ${session.token}`,
						},
					}),
			}}
		>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					<QueryClientProvider client={queryClient}>
						<TooltipProvider>{children}</TooltipProvider>
					</QueryClientProvider>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
