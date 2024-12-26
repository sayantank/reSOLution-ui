import ResolutionUI from "@/components/resolution-ui";
import { constructMetadata } from "@/lib/metadata";
import { programId } from "@/lib/program";
import { getResolutionPDA } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	return constructMetadata();
}

export default async function ResolutionPage({
	params,
}: {
	params: Promise<{ address: string }>;
}) {
	const address = (await params).address;

	let resolutionPDA: PublicKey | null = null;
	try {
		const owner = new PublicKey(address);

		resolutionPDA = getResolutionPDA(owner, programId);
	} catch (e) {
		console.warn("Invalid resolution account", { address, resolutionPDA });
		notFound();
	}

	// TODO: Use correct endpoint
	const res = await fetch("https://api.devnet.solana.com", {
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method: "getAccountInfo",
			params: [
				resolutionPDA.toString(),
				{
					encoding: "base64",
				},
			],
		}),
	});

	if (!res.ok) {
		console.error("Failed to fetch resolution account", {
			address,
			resolutionPDA,
		});
		notFound();
	}

	const json = await res.json();

	if (json.result?.value?.owner !== programId.toString()) {
		console.warn("Invalid resolution account", { address, resolutionPDA });
		notFound();
	}

	return (
		<div className="flex sm:pt-0 flex-col px-4 sm:px-0 items-stretch sm:items-center justify-center min-h-full w-full">
			<ResolutionUI resolutionKey={resolutionPDA.toString()} owner={address} />
		</div>
	);
}
