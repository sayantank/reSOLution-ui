import type { BN } from "@coral-xyz/anchor";
import { type Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
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

export function lamportsToSol(lamports: BN) {
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
