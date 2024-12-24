import ResolutionUI from "@/components/resolution-ui";
import { programId } from "@/lib/program";
import { getResolutionPDA } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { redirect } from "next/navigation";

export default async function ResolutionPage({
	params,
}: {
	params: Promise<{ address: string }>;
}) {
	const address = (await params).address;
	const owner = new PublicKey(address);

	const resolutionPDA = getResolutionPDA(owner, programId);

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
		redirect("/");
	}

	const json = await res.json();

	if (json.result?.value?.owner !== programId.toString()) {
		console.error("Invalid resolution account", { address, resolutionPDA });
		redirect("/");
	}

	return (
		<div className="flex pt-16 sm:pt-0 flex-col px-4 sm:px-0 items-stretch sm:items-center justify-center min-h-full w-full">
			<ResolutionUI resolutionKey={resolutionPDA.toString()} owner={address} />
		</div>
	);
}
