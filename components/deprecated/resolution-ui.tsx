"use client";

import { useResolution, useStakeAccount } from "@/hooks/solana";
import { calculateDays, cn, getExplorerURL, lamportsToSol } from "@/lib/utils";
import {
	PublicKey,
	StakeProgram,
	SYSVAR_CLOCK_PUBKEY,
	SYSVAR_STAKE_HISTORY_PUBKEY,
	type VersionedTransaction,
} from "@solana/web3.js";
import PostItNote from "../post-it";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import type { Deprecated_Resolution } from "@/lib/program";
import { Program } from "@coral-xyz/anchor";
import { useAnchorProvider } from "@/hooks/use-anchor-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MAX_U64 } from "@/app/consts";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { cluster } from "@/app/providers";
import { Skeleton } from "../ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { getXLink } from "@/lib/utils";
import {
	createVersionedTransaction,
	handleSendAndConfirmTransaction,
} from "@/lib/transactions";
import { Badge } from "../ui/badge";

const IDL = require("@/public/deprecated_idl.json");

export default function DeprecatedResolutionUI({
	resolutionKey,
	owner,
}: { resolutionKey: string; owner: string }) {
	const router = useRouter();

	const {
		data: resolutionData,
		isLoading,
		refetch: refetchResolution,
	} = useResolution({
		owner: new PublicKey(owner),
		deprecated: true,
	});

	const { data: stakeData, refetch: refetchStake } = useStakeAccount({
		stakeKey: resolutionData?.stakeAccount,
	});

	const { connection } = useConnection();
	const { connected, publicKey, signTransaction } = useWallet();
	const provider = useAnchorProvider();

	const [isShareLinkCopied, setIsShareLinkCopied] = useState(false);

	const isOwner = useMemo(() => {
		if (!connected || publicKey == null) {
			return false;
		}

		return publicKey.toString() === owner;
	}, [connected, publicKey, owner]);

	const shareXLink = useMemo(() => {
		if (resolutionData == null) {
			return "#";
		}

		return getXLink(resolutionData, isOwner);
	}, [resolutionData, isOwner]);

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

		const {
			stakeAccount: {
				stake: {
					delegation: { deactivationEpoch },
				},
			},
		} = stakeData;

		return deactivationEpoch !== BigInt(MAX_U64);
	}, [stakeData]);

	async function copyToClipboard() {
		if (typeof window === "undefined") {
			return;
		}

		try {
			await navigator.clipboard.writeText(window.location.href);
			setIsShareLinkCopied(true);
			setTimeout(() => setIsShareLinkCopied(false), 2000); // Reset after 2 seconds
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	}

	async function handleApprove(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();

		if (publicKey == null || signTransaction == null || !isApprover) {
			return;
		}

		const program = new Program<Deprecated_Resolution>(IDL, provider);

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

		const { confirmed } = await handleSendAndConfirmTransaction(
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

		const program = new Program<Deprecated_Resolution>(IDL, provider);

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

		const { confirmed } = await handleSendAndConfirmTransaction(
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

		const program = new Program<Deprecated_Resolution>(IDL, provider);

		const ix = await program.methods
			.closeResolution()
			.accountsStrict({
				owner: new PublicKey(owner),
				resolutionAccount: new PublicKey(resolutionKey),
				stakeAccount: new PublicKey(resolutionData.stakeAccount),
				clock: SYSVAR_CLOCK_PUBKEY,
				stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
				incineratorAccount: new PublicKey(
					"1nc1nerator11111111111111111111111111111111",
				),
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

		const { confirmed } = await handleSendAndConfirmTransaction(
			connection,
			signedTransaction,
		);

		if (confirmed) {
			router.replace("/");
		}
	}

	if (isLoading) {
		return (
			<div className="w-full sm:w-[32rem]">
				<Skeleton className="h-96 w-full mb-8" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (resolutionData == null) {
		return null;
	}

	return (
		<Dialog>
			<div>
				<div className={cn("w-full flex items-center justify-between mb-4")}>
					<p className={cn("text-lg font-medium")}>
						{resolutionData.owner.toString().slice(0, 6)}...'s resolution,
					</p>
					<DialogTrigger asChild>
						<button
							type="button"
							className={cn(
								"text-lg font-medium hover:underline cursor-pointer transition-all focus:outline-none",
							)}
						>
							{isShareLinkCopied ? "Link copied!" : "Share"}
						</button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Share resolution</DialogTitle>
							<DialogDescription>
								Let everyone know that you just bet on yourself on reSOLution!
							</DialogDescription>
						</DialogHeader>
						<div className="flex w-full items-center justify-end space-x-2">
							<Button type="button" onClick={copyToClipboard}>
								{isShareLinkCopied ? "Link copied!" : "Copy Link"}
							</Button>
							<Link href={shareXLink} target="_blank">
								<Button type="button">Share on X</Button>
							</Link>
						</div>
					</DialogContent>
				</div>
				<PostItNote className="mb-8">{resolutionData.text}</PostItNote>
				{stakeData != null && (
					<Card>
						<CardHeader className="border-b mb-6">
							<div className="w-full flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<CardTitle>Stake Account</CardTitle>
									<Badge variant="secondary" className="font-normal">
										{stakeData.stakeActivation.status}
									</Badge>
								</div>
								<Link
									href={getExplorerURL(
										"account",
										cluster,
										resolutionData.stakeAccount.toString(),
									)}
									target="_blank"
								>
									<ExternalLinkIcon className="size-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
								</Link>
							</div>
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
										{lamportsToSol(
											stakeData?.stakeAccountParsed?.value?.lamports,
										)}{" "}
										SOL
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
										<span className="font-normal text-base">
											days remaining
										</span>
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
								disabled={
									!isResolutionReady ||
									stakeData?.stakeActivation.status !== "inactive"
								}
								onClick={handleClaim}
							>
								{stakeData?.stakeActivation.status === "inactive"
									? "Claim"
									: "You can't claim yet"}
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
		</Dialog>
	);
}
