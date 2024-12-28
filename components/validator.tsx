import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "./ui/skeleton";
import { lamportsToSol } from "@/lib/utils";
import type { MouseEventHandler } from "react";

export default function Validator({
	validator,
	onClick,
}: { validator: string; onClick?: MouseEventHandler<HTMLButtonElement> }) {
	const { data, isLoading } = useQuery({
		queryKey: [
			"validator",
			{
				validator,
			},
		],
		queryFn: async () => {
			const response = await fetch(`/api/validator?validator=${validator}`, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error("Failed to fetch validator data", {
					validator,
					response: response.status,
				});
				return null;
			}

			const json = await response.json();

			return {
				name: json.name,
				details: json.details,
				active_stake: json.active_stake,
				url: json.www_url,
				validatorsAppUrl: json.url,
				voteAccount: json.vote_account,
				isActive: json.is_active,
			};
		},
		refetchOnWindowFocus: false,
		refetchInterval: 60 * 60 * 1000,
	});

	if (isLoading) {
		return <Skeleton className="h-20 w-full" />;
	}

	if (data == null) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full border text-left rounded-md p-4 hover:border-primary transition-all"
		>
			<p className="text-lg font-medium">{data?.name}</p>
			<div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
				<p className="text-muted-foreground flex-1">{data?.details}</p>
				<p>Stake: {lamportsToSol(data?.active_stake)} SOL</p>
			</div>
		</button>
	);
}
