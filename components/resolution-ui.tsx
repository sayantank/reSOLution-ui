"use client";

import { useResolution } from "@/hooks/use-resolution";
import { calculateDays, cn, lamportsToSol } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import PostItNote from "./post-it";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function ResolutionUI({
	resolutionKey,
	owner,
}: { resolutionKey: string; owner: string }) {
	const { data, isLoading } = useResolution({
		resolutionKey: new PublicKey(resolutionKey),
	});

	const { connected, publicKey } = useWallet();

	const isOwner = useMemo(() => {
		if (!connected || publicKey == null) {
			return false;
		}

		return publicKey.toString() === owner;
	}, [connected, publicKey, owner]);

	const isApprover = useMemo(() => {
		if (!connected || publicKey == null || data == null) {
			return false;
		}

		return data.approvers
			.map((p) => p.toString())
			.includes(publicKey.toString());
	}, [connected, publicKey, data]);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (data == null) {
		return null;
	}

	return (
		<div>
			<div className={cn("w-full flex items-center justify-between")}>
				<p className={cn("text-lg font-medium mb-4")}>
					{data.owner.toString().slice(0, 6)}...'s resolution,
				</p>
				<p>
					Approvals: {data.numApprovals}/{data.approvers.length}
				</p>
			</div>
			<PostItNote className="mb-8">{data.text}</PostItNote>
			<div>
				<div className="flex items-center space-x-2">
					<div className="flex-1 relative">
						<Input
							type="text"
							readOnly
							value={lamportsToSol(data.stakeAmount)}
						/>
						<p className="absolute right-0 top-1/4 mr-4 text-muted-foreground">
							SOL
						</p>
					</div>
					<div className="flex-1 relative">
						<Input
							type="text"
							readOnly
							value={calculateDays(data.startTime, data.endTime).remaining}
						/>
						<p className="absolute right-0 top-1/4 mr-4 text-muted-foreground">
							days remaining
						</p>
					</div>
				</div>
			</div>
			{isApprover && <Button className="mt-4 w-full">Approve</Button>}
		</div>
	);
}
