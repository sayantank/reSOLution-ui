"use client";

import { useEffect } from "react";
import PostItNote from "./post-it";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { cn, getResolutionPDA } from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { CircleAlert, ExternalLink, SettingsIcon } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	STAKE_CONFIG_ID,
	StakeProgram,
	SystemProgram,
	SYSVAR_CLOCK_PUBKEY,
	SYSVAR_RENT_PUBKEY,
	SYSVAR_STAKE_HISTORY_PUBKEY,
	type VersionedTransaction,
} from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";

import type { Resolution } from "@/lib/program";
import { useAnchorProvider } from "@/hooks/use-anchor-provider";
import WalletButton from "./wallet-btn";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useResolution } from "@/hooks/solana";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
	createVersionedTransaction,
	handleSendAndConfirmTransaction,
} from "@/lib/transactions";
import Link from "next/link";
import Validator from "./validator";

const IDL = require("@/public/idl.json");

// Mainnet - 9jYFwBfbjYmvasFbJyES9apLJDTkwtbgSDRWanHEvcRw
const WATCHTOWER_VALIDATOR_VOTE_ACCOUNT =
	"9jYFwBfbjYmvasFbJyES9apLJDTkwtbgSDRWanHEvcRw";

type FormValues = {
	resolutionText: string;
	publicKey: string;
	stake: number;
	duration: number;
	validatorVoteAccount: string;
	approvers: string[];
};

export default function ResolutionForm() {
	const router = useRouter();
	const { connection } = useConnection();
	const { connected, publicKey, signTransaction } = useWallet();

	const { data: resolutionData, refetch } = useResolution({ owner: publicKey });

	const { control, handleSubmit, setValue, formState, watch } =
		useForm<FormValues>({
			defaultValues: {
				resolutionText: "",
				validatorVoteAccount: WATCHTOWER_VALIDATOR_VOTE_ACCOUNT,
				duration: 365,
				stake: 0,
				approvers: ["", "", ""],
			},
			mode: "all",
		});

	const approvers = watch("approvers");
	const stakeAmount = watch("stake");

	const provider = useAnchorProvider();

	useEffect(() => {
		if (publicKey != null) {
			setValue("publicKey", publicKey.toString());
		}
	}, [publicKey, setValue]);

	async function onSubmit(data: FormValues) {
		if (publicKey == null || signTransaction == null) {
			return;
		}

		const program = new Program<Resolution>(IDL, provider);

		const lamports = new BN(data.stake * LAMPORTS_PER_SOL);
		const duration = new BN(data.duration * 24 * 60 * 60);

		const resolutionPDA = getResolutionPDA(publicKey, program.programId);
		const stakeKeypair = Keypair.generate();

		const ix = await program.methods
			.initializeResolution(lamports, duration, data.resolutionText)
			.accountsStrict({
				owner: publicKey,
				resolutionAccount: resolutionPDA,
				stakeAccount: stakeKeypair.publicKey,
				validatorVoteAccount: new PublicKey(data.validatorVoteAccount),
				stakeConfig: STAKE_CONFIG_ID,
				rent: SYSVAR_RENT_PUBKEY,
				clock: SYSVAR_CLOCK_PUBKEY,
				stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
				stakeProgram: StakeProgram.programId,
				systemProgram: SystemProgram.programId,
			})
			.remainingAccounts(
				data.approvers.map((approver) => ({
					isSigner: false,
					isWritable: false,
					pubkey: new PublicKey(approver),
				})),
			)
			.instruction();

		const transaction = await createVersionedTransaction(
			connection,
			[ix],
			publicKey,
		);

		let signedTransaction: VersionedTransaction | undefined;

		try {
			signedTransaction = await signTransaction(transaction);
			// Add the sign for the new stake account
			signedTransaction.sign([stakeKeypair]);
		} catch (e) {
			toast.error("Failed to sign transaction.");
			return;
		}

		const { confirmed } = await handleSendAndConfirmTransaction(
			connection,
			signedTransaction,
		);

		if (confirmed) {
			await refetch();
		}
	}

	return (
		<Dialog>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div
					className={cn(
						"w-full flex items-center justify-end mb-4",
						publicKey != null ? "opacity-100" : "opacity-0",
					)}
				>
					{resolutionData == null && (
						<DialogTrigger asChild>
							<SettingsIcon
								className={cn(
									formState.errors.validatorVoteAccount &&
										"text-destructive animate-pulse",
								)}
							/>
						</DialogTrigger>
					)}
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Validator Configuration</DialogTitle>
							<DialogDescription>
								Configure the validator{" "}
								<span className="underline">vote account</span> you want to
								delegate your SOL to.
							</DialogDescription>
						</DialogHeader>

						<Controller
							control={control}
							name="validatorVoteAccount"
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
								<>
									<Input
										type="text"
										className={cn(
											fieldState.invalid && "border-red-400",
											"font-mono",
										)}
										{...field}
									/>
								</>
							)}
						/>

						<div className="space-y-2">
							<div className="w-full flex items-center justify-between">
								<h3>Recommended Validator</h3>
								<Link
									href="https://www.validators.app/validators?locale=en&network=mainnet"
									target="_blank"
								>
									<div className="flex items-center space-x-1 group text-muted-foreground hover:text-primary">
										<p>Find more</p>
										<ExternalLink className="size-4 cursor-pointer transition-colors" />
									</div>
								</Link>
							</div>
							<Validator
								onClick={(e) => {
									e.preventDefault();
									setValue(
										"validatorVoteAccount",
										"9jYFwBfbjYmvasFbJyES9apLJDTkwtbgSDRWanHEvcRw",
									);
								}}
								validator="SDEVqCDyc3YzjrDn375SMWKpZo1m7tbZ12fsenF48x1"
							/>
						</div>

						<DialogClose asChild>
							<Button>Continue</Button>
						</DialogClose>
					</DialogContent>
				</div>
				<Controller
					control={control}
					name="resolutionText"
					rules={{ required: true, minLength: 1, maxLength: 256 }}
					render={({ field }) => (
						<PostItNote
							placeholder={
								resolutionData != null
									? "You already have a resolution ¯\\_(ツ)_/¯"
									: "Write your resolution..."
							}
							value={field.value}
							onChange={field.onChange}
							className="mb-8"
							disabled={resolutionData != null}
						/>
					)}
				/>

				{!connected ? (
					<WalletButton className="w-full" />
				) : resolutionData == null ? (
					<div>
						<div className="flex items-center space-x-2">
							<Controller
								control={control}
								name="stake"
								rules={{ required: true, validate: (value) => value > 0 }}
								render={({ field, fieldState }) => (
									<div className="flex-1 relative">
										<Input
											type="text"
											placeholder="5"
											className={cn(
												fieldState.error != null && "border-red-400",
												stakeAmount > 10 && "border-yellow-400",
											)}
											{...field}
										/>
										<Tooltip delayDuration={200}>
											<div
												className={cn(
													"absolute right-0 top-1/4 mr-4 text-muted-foreground flex items-center space-x-2",
													stakeAmount > 10
														? "text-yellow-500"
														: "text-muted-foreground",
												)}
											>
												{stakeAmount > 10 && (
													<TooltipTrigger>
														<CircleAlert className="size-4" />
													</TooltipTrigger>
												)}
												<p>SOL</p>
											</div>
											<TooltipContent className="border-yellow-400">
												<p className="text-yellow-500 text-base">
													That's a lot of SOL!
												</p>
											</TooltipContent>
										</Tooltip>
									</div>
								)}
							/>

							<Controller
								control={control}
								name="duration"
								rules={{ required: true }}
								render={({ field, fieldState }) => (
									<div className="flex-1 relative">
										<Input
											type="text"
											placeholder="365"
											className={cn(
												fieldState.error != null && "border-red-400",
											)}
											{...field}
										/>
										<p className="absolute right-0 top-1/4 mr-4 text-muted-foreground">
											days
										</p>
									</div>
								)}
							/>
						</div>
						<p className="mt-4 mb-2">Approvers</p>
						<div className="space-y-2 w-full">
							{approvers.map((_, index) => (
								<Controller
									control={control}
									name={`approvers.${index}`}
									key={index}
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
											placeholder={`Approver #${index + 1}`}
											className={cn(
												fieldState.invalid && "border-red-400",
												"font-mono",
											)}
											{...field}
										/>
									)}
								/>
							))}
						</div>
						<Button
							type="submit"
							className="w-full mt-4"
							disabled={
								!formState.isValid ||
								formState.isSubmitting ||
								resolutionData != null
							}
						>
							{resolutionData != null
								? "You already have a resolution"
								: "Submit"}
						</Button>
					</div>
				) : (
					<Button
						type="button"
						className="w-full"
						onClick={() =>
							router.push(`/resolution/${resolutionData.owner.toString()}`)
						}
					>
						Go to my resolution
					</Button>
				)}
			</form>
		</Dialog>
	);
}
