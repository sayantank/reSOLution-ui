import { cluster } from "@/app/providers";
import type { BN } from "@coral-xyz/anchor";
import {
	type Cluster,
	type Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
	type TransactionInstruction,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { CircleCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

const TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 1000;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getResolutionPDA(owner: PublicKey, programId: PublicKey) {
	const [resolutionPDA] = PublicKey.findProgramAddressSync(
		[Buffer.from("resolution"), owner.toBuffer()],
		programId,
	);
	return resolutionPDA;
}

export async function waitForConfirmation(
	signature: string,
	connection: Connection,
	timeout = 15000,
) {
	const timeoutPromise = new Promise<boolean>((resolve) => {
		setTimeout(() => resolve(false), timeout);
	});

	const confirmed = await Promise.race([
		timeoutPromise,
		(async () => {
			const maxChecks = Math.floor(TIMEOUT_MS / POLL_INTERVAL_MS);

			let landed = false;
			let checks = 0;

			while (!landed) {
				const status = await connection.getSignatureStatus(signature, {
					searchTransactionHistory: true,
				});
				if (
					status.value?.confirmationStatus === "confirmed" ||
					status.value?.confirmationStatus === "finalized"
				) {
					landed = true;
				} else {
					checks++;
					if (checks >= maxChecks) {
						break;
					}
					await sleep(POLL_INTERVAL_MS);
				}
			}

			return landed;
		})(),
	]);

	return confirmed;
}

export function lamportsToSol(lamports: BN | number) {
	if (typeof lamports === "number") {
		const sol = lamports / LAMPORTS_PER_SOL;
		return sol % 1 === 0 ? sol.toString() : sol.toFixed(3);
	}
	const sol = lamports.toNumber() / LAMPORTS_PER_SOL;
	return sol % 1 === 0 ? sol.toString() : sol.toFixed(3);
}

export function calculateDays(start: BN, end: BN) {
	const diff = end.sub(start).toNumber();

	const now = Date.now() / 1000;

	return {
		days: Math.floor(diff / (24 * 60 * 60)),
		remaining: Math.floor((end.toNumber() - now) / (24 * 60 * 60)),
	};
}

export async function createVersionedTransaction(
	connection: Connection,
	ixs: TransactionInstruction[],
	payerKey: PublicKey,
) {
	const {
		value: { blockhash },
	} = await connection.getLatestBlockhashAndContext();

	const messageLegacy = new TransactionMessage({
		payerKey,
		recentBlockhash: blockhash,
		instructions: ixs,
	}).compileToLegacyMessage();

	return new VersionedTransaction(messageLegacy);
}

export async function handleSendAndConfirmTransaction(
	connection: Connection,
	transaction: VersionedTransaction,
) {
	const sendPromise = connection.sendTransaction(transaction);

	toast.promise(sendPromise, {
		loading: "Submitting transaction...",
		success: "Transaction submitted successfully!",
		error: "Failed to submit transaction.",
	});

	const txSignature = await sendPromise;

	const confirmationPromise = waitForConfirmation(txSignature, connection);

	toast.promise(confirmationPromise, {
		loading: "Waiting for confirmation...",
		success: (_) => {
			return (
				<div className="w-full flex items-center justify-between">
					<div className="flex items-center space-x-1">
						<CircleCheck className="size-4" />
						<p className="font-medium">Transaction submitted successfully!</p>
					</div>
					<Link
						href={getExplorerURL("transaction", cluster, txSignature)}
						target="_blank"
					>
						<ExternalLink className="size-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
					</Link>
				</div>
			);
		},
		error: "Failed to confirm transaction.",
	});

	const confirmed = await confirmationPromise;

	return {
		txSignature,
		confirmed,
	};
}

export function getExplorerURL(
	type: "account" | "transaction",
	cluster: Cluster,
	value: string,
) {
	const url = new URL("https://explorer.solana.com");

	switch (type) {
		case "account":
			url.pathname = `/address/${value}`;
			break;
		case "transaction":
			url.pathname = `/tx/${value}`;
			break;
	}

	if (cluster !== "mainnet-beta") {
		url.searchParams.set("cluster", cluster);
	}

	return url.toString();
}
