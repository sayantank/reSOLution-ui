"use client";

import { useEffect } from "react";
import PostItNote from "./post-it";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import {
	cn,
	createVersionedTransaction,
	getResolutionPDA,
	handleSendAndConfirmTransaction,
} from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { SettingsIcon } from "lucide-react";
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

const IDL = require("@/public/idl.json");

// Mainnet - 9jYFwBfbjYmvasFbJyES9apLJDTkwtbgSDRWanHEvcRw
const WATCHTOWER_VALIDATOR_VOTE_ACCOUNT =
	"5iic7eCs3tGKQvscTaY3Lb8mr6HvogpZKoxgxazxdiCA";

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

		const confirmed = await handleSendAndConfirmTransaction(
			connection,
			signedTransaction,
		);

		if (confirmed) {
			router.push(`/resolution/${publicKey.toString()}`);
		}
	}

	return (
		<Dialog>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div
					className={cn(
						"w-full flex items-center justify-between mb-4",
						publicKey != null ? "opacity-100" : "opacity-0",
					)}
				>
					<p className={cn("text-lg font-medium")}>
						{publicKey?.toString().slice(0, 6)}...'s resolution,
					</p>
					<DialogTrigger>
						<SettingsIcon
							className={cn(
								formState.errors.validatorVoteAccount &&
									"text-destructive animate-pulse",
							)}
						/>
					</DialogTrigger>
					<DialogContent className="font-sans">
						<DialogHeader>
							<DialogTitle>Advanced Configuration</DialogTitle>
							<DialogDescription>
								Configure the validator you want to delegate your SOL to.
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
										className={cn(fieldState.invalid && "border-red-400")}
										{...field}
									/>
								</>
							)}
						/>

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
							placeholder="Write your resolution..."
							value={field.value}
							onChange={field.onChange}
							className="mb-8"
						/>
					)}
				/>

				{!connected ? (
					<WalletButton className="w-full" />
				) : (
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
											placeholder="25"
											className={cn(
												fieldState.error != null && "border-red-400",
											)}
											{...field}
										/>
										<p className="absolute right-0 top-1/4 mr-4 text-muted-foreground">
											SOL
										</p>
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
							disabled={!formState.isValid || formState.isSubmitting}
						>
							Submit
						</Button>
					</div>
				)}
			</form>
		</Dialog>
	);
}
