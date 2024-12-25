import {
	type Connection,
	type TransactionInstruction,
	type PublicKey,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";
import { CircleCheck, Link, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { waitForConfirmation, getExplorerURL } from "./utils";
import { cluster } from "@/app/providers";

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
		success: (confirmed) => {
			if (confirmed) {
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
			}
			return "Failed to confirm transaction.";
		},
		error: "Failed to confirm transaction.",
	});

	const confirmed = await confirmationPromise;

	return {
		txSignature,
		confirmed,
	};
}
