import { useConnection } from "@solana/wallet-adapter-react";
import {
	type Cluster,
	type ParsedAccountData,
	PublicKey,
} from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useAnchorProvider } from "./use-anchor-provider";
import type { Resolution } from "@/lib/program";
import { Program } from "@coral-xyz/anchor";
import { useMemo } from "react";
import { getResolutionPDA } from "@/lib/utils";

const IDL = require("@/public/idl.json");

export function useResolution({ owner }: { owner?: PublicKey | null }) {
	const { connection } = useConnection();
	const provider = useAnchorProvider();

	const program = useMemo(() => {
		return new Program<Resolution>(IDL, provider);
	}, [provider]);

	const resolutionKey = useMemo(
		() => (owner ? getResolutionPDA(owner, program.programId) : null),
		[owner, program],
	);

	return useQuery({
		queryKey: [
			"resolution",
			{
				endpoint: connection.rpcEndpoint,
				owner: owner?.toString(),
			},
		],
		queryFn: () => program.account.resolutionAccount.fetch(resolutionKey ?? ""),
		enabled: owner != null && resolutionKey != null,
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

export function useValidator({
	voteAccount,
	cluster,
}: { voteAccount: PublicKey | string; cluster: Cluster }) {
	const votePubkey = useMemo(() => {
		if (typeof voteAccount === "string") {
			return new PublicKey(voteAccount);
		}
		return voteAccount;
	}, [voteAccount]);

	const { connection } = useConnection();

	const { data: voteAccountInfo } = useQuery({
		queryKey: [
			"vote-account",
			{ endpoint: connection.rpcEndpoint, votePubkey: votePubkey.toString() },
		],
		queryFn: () => connection.getParsedAccountInfo(votePubkey),
		refetchOnWindowFocus: false,
		refetchInterval: 300 * 1000,
	});

	const validatorIdentity = useMemo(() => {
		if (voteAccountInfo == null) {
			return null;
		}

		return voteAccountInfo.value != null
			? (voteAccountInfo.value.data as ParsedAccountData)?.parsed?.info
					.authorizedVoters?.[0].authorizedVoter
			: null;
	}, [voteAccountInfo]);

	return validatorIdentity;

	// return useQuery({
	// 	queryKey: [
	// 		"validator",
	// 		{
	// 			identity: validatorIdentity?.toString(),
	// 		},
	// 	],
	// 	queryFn: async () => {
	// 		if (validatorIdentity == null) {
	// 			throw new Error("Invalid validator identity");
	// 		}

	// 		const urlCluster =
	// 			cluster === WalletAdapterNetwork.Mainnet ? "mainnet" : cluster;

	// 		// TODO: use cluster
	// 		const response = await fetch(
	// 			`https://www.validators.app/api/v1/validators/mainnet/${validatorIdentity}.json`,
	// 			{
	// 				headers: {
	// 					"Content-Type": "application/json",
	// 					Token: process.env.NEXT_PUBLIC_VALIDATORS_APP_TOKEN!,
	// 				},
	// 			},
	// 		);

	// 		if (!response.ok) {
	// 			console.error("Failed to fetch validator data", {
	// 				validatorIdentity,
	// 			});
	// 			return null;
	// 		}

	// 		const json = await response.json();

	// 		return {
	// 			name: json.name,
	// 			details: json.details,
	// 			active_stake: json.active_stake,
	// 			url: json.www_url,
	// 			validatorsAppUrl: json.url,
	// 			voteAccount: json.vote_account,
	// 			isActive: json.is_active,
	// 		};
	// 	},
	// 	refetchOnWindowFocus: false,
	// 	refetchInterval: 60 * 60 * 1000,
	// 	enabled: validatorIdentity != null,
	// });
}
