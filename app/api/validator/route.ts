import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = new URL(request.url).searchParams;

	const validator = searchParams.get("validator");

	if (validator == null) {
		return new Response("Invalid validator", { status: 400 });
	}

	const url = `https://www.validators.app/api/v1/validators/mainnet/${validator}.json`;

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			Token: process.env.VALIDATORS_APP_TOKEN!,
		},
	});

	if (!response.ok) {
		console.error("Failed to fetch validator data", {
			url,
		});
		return new Response("Failed to fetch validator data", {
			status: response.status,
		});
	}

	const json = await response.json();

	return new Response(
		JSON.stringify({
			name: json.name,
			details: json.details,
			active_stake: json.active_stake,
			url: json.www_url,
			validatorsAppUrl: json.url,
			voteAccount: json.vote_account,
			isActive: json.is_active,
		}),
	);
}
