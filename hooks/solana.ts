import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useAnchorProvider } from "./use-anchor-provider";
import type { Resolution, Deprecated_Resolution } from "@/lib/program";
import { Program } from "@coral-xyz/anchor";
import { useMemo } from "react";
import { getResolutionPDA } from "@/lib/utils";
import {
	getStakeAccount,
	getStakeActivatingAndDeactivating,
	getStakeHistory,
} from "@/lib/solana";

const IDL = require("@/public/idl.json");
const Deprecated_IDL = require("@/public/deprecated_idl.json");

export function useResolution({
	owner,
	deprecated = false,
}: { owner?: PublicKey | null; deprecated?: boolean }) {
	const { connection } = useConnection();
	const provider = useAnchorProvider();

	const program = useMemo(() => {
		if (!deprecated) {
			return new Program<Resolution>(IDL, provider);
		}
		return new Program<Deprecated_Resolution>(Deprecated_IDL, provider);
	}, [provider, deprecated]);

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

	const SYSVAR_STAKE_HISTORY_ADDRESS = new PublicKey(
		"SysvarStakeHistory1111111111111111111111111",
	);

	return useQuery({
		queryKey: [
			"stake-account",
			{ endpoint: connection.rpcEndpoint, stakeKey: stakeKey?.toString() },
		],
		queryFn: async () => {
			if (stakeKey == null) {
				return null;
			}

			const [epochInfo, { stakeAccountParsed, stakeAccount }, stakeHistory] =
				await Promise.all([
					connection.getEpochInfo(),
					(async () => {
						const stakeAccountParsed =
							await connection.getParsedAccountInfo(stakeKey);
						if (
							stakeAccountParsed === null ||
							stakeAccountParsed.value === null
						) {
							throw new Error("Account not found");
						}
						return {
							stakeAccount: getStakeAccount(stakeAccountParsed),
							stakeAccountParsed,
						};
					})(),
					(async () => {
						const stakeHistoryParsed = await connection.getParsedAccountInfo(
							SYSVAR_STAKE_HISTORY_ADDRESS,
						);
						if (stakeHistoryParsed === null) {
							throw new Error("StakeHistory not found");
						}
						return getStakeHistory(stakeHistoryParsed);
					})(),
				]);

			const { effective, activating, deactivating } =
				getStakeActivatingAndDeactivating(
					{
						...stakeAccount.stake.delegation,
						voterPubkey: stakeAccount.stake.delegation.voterPubkey,
					},
					BigInt(epochInfo.epoch),
					stakeHistory,
				);

			let status: "inactive" | "active" | "activating" | "deactivating";

			if (deactivating > 0) {
				status = "deactivating";
			} else if (activating > 0) {
				status = "activating";
			} else if (effective > 0) {
				status = "active";
			} else {
				status = "inactive";
			}
			const inactive =
				BigInt(stakeAccountParsed.value!.lamports) -
				effective -
				stakeAccount.meta.rentExemptReserve;

			return {
				stakeAccountParsed,
				stakeAccount,
				stakeActivation: {
					active: effective,
					inactive,
					status,
				},
			};
		},
		enabled: stakeKey != null,
		refetchOnWindowFocus: false,
		refetchInterval: 300 * 1000,
	});
}
