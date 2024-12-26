"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

export default function SearchPage() {
	const router = useRouter();
	const { control, handleSubmit, formState } = useForm<{
		walletAddress: string;
	}>({
		defaultValues: {
			walletAddress: "",
		},
		mode: "all",
	});
	return (
		<div className="flex flex-col sm:pt-0 px-4 sm:px-0 items-stretch sm:items-center justify-center min-h-full w-full">
			<div className="w-full max-w-3xl text-center">
				<h1 className="font-handwriting text-3xl tracking-wide">
					Search for a resolution
				</h1>

				<form
					onSubmit={handleSubmit((data) =>
						router.push(`/resolution/${data.walletAddress}`),
					)}
				>
					<div className="flex-1 relative mt-4">
						<Controller
							control={control}
							name="walletAddress"
							rules={{
								required: true,
								validate: (value) => {
									try {
										new PublicKey(value);
										return true;
									} catch (e) {
										console.error("error:", e);
										return "Please enter a valid Solana public key";
									}
								},
							}}
							render={({ field, fieldState }) => (
								<Input
									type="text"
									placeholder="Enter a wallet address...."
									className={cn(fieldState.error != null && "border-red-400")}
									{...field}
								/>
							)}
						/>
						<button
							type="submit"
							className="absolute right-0 top-1/4 disabled:opacity-20"
							disabled={!formState.isValid || formState.isSubmitting}
						>
							<SearchIcon className="mr-6 text-muted-foreground size-6 hover:text-primary transition-all" />
						</button>
					</div>
					<input
						type="submit"
						className="hidden"
						disabled={!formState.isValid || formState.isSubmitting}
					/>
				</form>
			</div>
		</div>
	);
}
