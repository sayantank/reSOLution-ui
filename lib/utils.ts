import type { Connection } from "@solana/web3.js";
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
