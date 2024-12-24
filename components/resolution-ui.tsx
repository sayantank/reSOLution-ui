"use client";

import { useEpochInfo, useResolution, useStakeAccount } from "@/hooks/solana";
import {
	calculateDays,
	cn,
	createVersionedTransaction,
	handleSendAndConfirmTransaction,
	lamportsToSol,
} from "@/lib/utils";
import {
	type ParsedAccountData,
	PublicKey,
	StakeProgram,
	SYSVAR_CLOCK_PUBKEY,
	SYSVAR_STAKE_HISTORY_PUBKEY,
	type VersionedTransaction,
} from "@solana/web3.js";
import PostItNote from "./post-it";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import type { Resolution } from "@/lib/program";
import { Program } from "@coral-xyz/anchor";
import { useAnchorProvider } from "@/hooks/use-anchor-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MAX_U64 } from "@/app/consts";

const IDL = require("@/public/idl.json");

export default function ResolutionUI({
	resolutionKey,
	owner,
}: { resolutionKey: string; owner: string }) {
	const router = useRouter();

	const {
		data: resolutionData,
		isLoading,
		refetch: refetchResolution,
	} = useResolution({
		resolutionKey: new PublicKey(resolutionKey),
	});

	const { data: stakeData, refetch: refetchStake } = useStakeAccount({
		stakeKey: resolutionData?.stakeAccount,
	});

	const { data: epochData } = useEpochInfo();

	const { connection } = useConnection();
	const { connected, publicKey, signTransaction } = useWallet();
	const provider = useAnchorProvider();

	useEffect(() => {
		console.log(stakeData?.value);
	}, [stakeData]);

	const isOwner = useMemo(() => {
		if (!connected || publicKey == null) {
			return false;
		}

		return publicKey.toString() === owner;
	}, [connected, publicKey, owner]);

	const isApprover = useMemo(() => {
		if (!connected || publicKey == null || resolutionData == null) {
			return false;
		}

		return resolutionData.approvers
			.map((p) => p.toString())
			.includes(publicKey.toString());
	}, [connected, publicKey, resolutionData]);

	const isResolutionReady = useMemo(() => {
		if (!isOwner || resolutionData == null) {
			return false;
		}

		return (
			resolutionData.approvedBy.length >= resolutionData.approvers.length ||
			resolutionData.endTime.toNumber() < Date.now() / 1000
		);
	}, [isOwner, resolutionData]);

	const isDeactivated = useMemo(() => {
		if (stakeData == null) {
			return false;
		}

		const deactivationEpoch = (stakeData.value?.data as ParsedAccountData)
			.parsed.info.stake.delegation.deactivationEpoch;

		if (deactivationEpoch === MAX_U64) {
			return false;
		}

		return true;
	}, [stakeData]);

	const isClaimable = useMemo(() => {
		if (stakeData == null || epochData == null) {
			return false;
		}

		const deactivationEpoch = (stakeData.value?.data as ParsedAccountData)
			.parsed.info.stake.delegation.deactivationEpoch;

		const currentEpoch = epochData.epoch;

		return (
			isResolutionReady && isDeactivated && currentEpoch >= deactivationEpoch
		);
	}, [isDeactivated, isResolutionReady, epochData, stakeData]);

	async function handleApprove(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();

		if (publicKey == null || signTransaction == null || !isApprover) {
			return;
		}

		const program = new Program<Resolution>(IDL, provider);

		const ix = await program.methods
			.approveResolution()
			.accountsStrict({
				signer: publicKey,
				owner: new PublicKey(owner),
				resolutionAccount: new PublicKey(resolutionKey),
			})
			.instruction();

		const transaction = await createVersionedTransaction(
			connection,
			[ix],
			publicKey,
		);

		let signedTransaction: VersionedTransaction | undefined;

		try {
			signedTransaction = await signTransaction(transaction);
		} catch (e) {
			toast.error("Failed to sign transaction.");
			return;
		}

		const confirmed = await handleSendAndConfirmTransaction(
			connection,
			signedTransaction,
		);

		if (confirmed) {
			await refetchResolution();
		}
	}

	async function handleDeactivate(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();

		if (
			publicKey == null ||
			signTransaction == null ||
			!isOwner ||
			resolutionData == null
		) {
			return;
		}

		const program = new Program<Resolution>(IDL, provider);

		const ix = await program.methods
			.deactivateResolutionStake()
			.accountsStrict({
				owner: new PublicKey(owner),
				clock: SYSVAR_CLOCK_PUBKEY,
				resolutionAccount: new PublicKey(resolutionKey),
				stakeAccount: new PublicKey(resolutionData.stakeAccount),
				stakeProgram: StakeProgram.programId,
			})
			.instruction();

		const transaction = await createVersionedTransaction(
			connection,
			[ix],
			publicKey,
		);

		let signedTransaction: VersionedTransaction | undefined;

		try {
			signedTransaction = await signTransaction(transaction);
		} catch (e) {
			toast.error("Failed to sign transaction.");
			return;
		}

		const confirmed = await handleSendAndConfirmTransaction(
			connection,
			signedTransaction,
		);

		if (confirmed) {
			await refetchResolution();
			await refetchStake();
		}
	}

	async function handleClaim(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();

		if (
			publicKey == null ||
			signTransaction == null ||
			!isOwner ||
			resolutionData == null
		) {
			return;
		}

		const program = new Program<Resolution>(IDL, provider);

		const ix = await program.methods
			.closeResolution()
			.accountsStrict({
				owner: new PublicKey(owner),
				resolutionAccount: new PublicKey(resolutionKey),
				stakeAccount: new PublicKey(resolutionData.stakeAccount),
				clock: SYSVAR_CLOCK_PUBKEY,
				stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
				stakeProgram: StakeProgram.programId,
			})
			.instruction();

		const transaction = await createVersionedTransaction(
			connection,
			[ix],
			publicKey,
		);

		let signedTransaction: VersionedTransaction | undefined;

		try {
			signedTransaction = await signTransaction(transaction);
		} catch (e) {
			toast.error("Failed to sign transaction.");
			return;
		}

		const confirmed = await handleSendAndConfirmTransaction(
			connection,
			signedTransaction,
		);

		if (confirmed) {
			router.replace("/");
		}
	}

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (resolutionData == null) {
		return null;
	}

	return (
		<div>
			<div className={cn("w-full flex items-center justify-between mb-4")}>
				<p className={cn("text-lg font-medium")}>
					{resolutionData.owner.toString().slice(0, 6)}...'s resolution,
				</p>
			</div>
			<PostItNote className="mb-8">{resolutionData.text}</PostItNote>
			{stakeData != null && (
				<Card>
					<CardHeader className="border-b mb-6">
						<CardTitle>Stake Details</CardTitle>
						<CardDescription>
							Details of the stake account created for your resolution.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex">
							<div className="space-y-0.5 flex-1">
								<p>Stake:</p>
								<h3 className="text-lg font-semibold">
									{lamportsToSol(resolutionData.stakeAmount)} SOL
								</h3>
							</div>
							<div className="space-y-0.5 flex-1">
								<p>Balance:</p>
								<h3 className="text-lg font-semibold">
									{lamportsToSol(stakeData?.value?.lamports)} SOL
								</h3>
							</div>
						</div>
						<div className="flex mt-4">
							<div className="space-y-0.5 flex-1">
								<p>Approvals:</p>
								<h3 className="text-lg font-semibold">
									{resolutionData.approvers.length -
										resolutionData.approvedBy.length}{" "}
									<span className="font-normal text-base">left</span>
								</h3>
							</div>
							<div className="space-y-0.5 flex-1">
								<p>Lockup:</p>
								<h3 className="text-lg font-semibold">
									{
										calculateDays(
											resolutionData.startTime,
											resolutionData.endTime,
										).remaining
									}{" "}
									<span className="font-normal text-base">days remaining</span>
								</h3>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
			{isOwner && (
				<div className="space-y-2">
					{isDeactivated ? (
						<Button
							className="mt-4 w-full"
							disabled={!isResolutionReady}
							onClick={handleClaim}
						>
							{isClaimable ? "Claim" : "You can't claim yet"}
						</Button>
					) : (
						<Button
							className="mt-4 w-full"
							disabled={!isResolutionReady}
							onClick={handleDeactivate}
						>
							{isResolutionReady ? "Deactivate" : "You can't deactivate yet"}
						</Button>
					)}
				</div>
			)}
			{isApprover && (
				<Button
					className="mt-4 w-full"
					onClick={handleApprove}
					disabled={
						!isApprover ||
						resolutionData.approvedBy
							.map((p) => p.toString())
							.includes(publicKey?.toString() ?? "")
					}
				>
					Approve
				</Button>
			)}
		</div>
	);
}
