import { useConnection } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useAnchorProvider } from "./use-anchor-provider";
import type { Resolution } from "@/lib/program";
import { Program } from "@coral-xyz/anchor";
import { useMemo } from "react";

const IDL = require("@/public/idl.json");

export function useResolution({ resolutionKey }: { resolutionKey: PublicKey }) {
	const { connection } = useConnection();
	const provider = useAnchorProvider();

	const program = useMemo(() => {
		return new Program<Resolution>(IDL, provider);
	}, [provider]);

	return useQuery({
		queryKey: [
			"resolution",
			{
				endpoint: connection.rpcEndpoint,
				resolutionKey: resolutionKey.toString(),
			},
		],
		queryFn: () => program.account.resolutionAccount.fetch(resolutionKey),
		refetchOnWindowFocus: false,
		refetchInterval: 300 * 1000,
	});
}

export function useStakeAccount({ stakeKey }: { stakeKey?: PublicKey }) {
	const { connection } = useConnection();

	return useQuery({
		queryKey: [
			"stake-account",
			{ endpoint: connection.rpcEndpoint, stakeKey: stakeKey?.toString() },
		],
		queryFn: () => {
			if (stakeKey == null) {
				return null;
			}
			return connection.getParsedAccountInfo(stakeKey);
		},
		enabled: stakeKey != null,
		refetchOnWindowFocus: false,
		refetchInterval: 300 * 1000,
	});
}

export function useEpochInfo() {
	const { connection } = useConnection();

	return useQuery({
		queryKey: ["epoch-info", { endpoint: connection.rpcEndpoint }],
		queryFn: () => connection.getEpochInfo(),
		refetchOnWindowFocus: false,
		refetchInterval: 300 * 1000,
	});
}
