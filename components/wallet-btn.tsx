"use client";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletButton({ className }: { className?: string }) {
	const { setVisible } = useWalletModal();
	const { connected, publicKey, disconnect } = useWallet();

	// if (connected) {
	// 	return <Button type="button" className={cn(className, "text-lg py-6")}>
	// 			Disco
	// 	</Button>
	// }

	return (
		<Button
			onClick={() => {
				if (connected) {
					disconnect();
				} else {
					setVisible(true);
				}
			}}
			className={cn(className)}
		>
			{publicKey != null
				? `${publicKey.toString().slice(0, 8)}...`
				: "Connect Wallet"}
		</Button>
	);
}
