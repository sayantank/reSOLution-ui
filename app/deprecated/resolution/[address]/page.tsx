import DeprecatedResolutionUI from "@/components/deprecated/resolution-ui";
import { constructMetadata } from "@/lib/metadata";
import { deprecated_programId } from "@/lib/program";
import { getResolutionPDA } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { cookies } from "next/headers";
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

		resolutionPDA = getResolutionPDA(owner, deprecated_programId);
	} catch (e) {
		console.warn("Failed to get resolution PDA", { address, resolutionPDA });
		notFound();
	}

	const cookieStore = await cookies();
	const bearerToken = cookieStore.get("session")?.value;
	if (bearerToken == null) {
		console.error("JWT Token is not set", {
			bearerToken,
		});

		throw new Error("JWT Token is not set");
	}

	const res = await fetch(process.env.NEXT_PUBLIC_IRONFORGE_URL!, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${bearerToken}`,
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

	if (json.result?.value?.owner !== deprecated_programId.toString()) {
		console.warn("Invalid resolution account", { address, resolutionPDA });
		notFound();
	}

	return (
		<div className="flex sm:pt-0 flex-col px-4 sm:px-0 items-stretch sm:items-center justify-center min-h-full w-full">
			<DeprecatedResolutionUI
				resolutionKey={resolutionPDA.toString()}
				owner={address}
			/>
		</div>
	);
}
