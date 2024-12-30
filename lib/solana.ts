import type {
	AccountInfo,
	ParsedAccountData,
	RpcResponseAndContext,
} from "@solana/web3.js";

type Delegation = {
	voterPubkey: Uint8Array;
	stake: bigint;
	activationEpoch: bigint;
	deactivationEpoch: bigint;
};

type StakeHistoryEntry = {
	epoch: bigint;
	effective: bigint;
	activating: bigint;
	deactivating: bigint;
};

interface StakeActivatingAndDeactivating {
	effective: bigint;
	activating: bigint;
	deactivating: bigint;
}

interface EffectiveAndActivating {
	effective: bigint;
	activating: bigint;
}

type StakeAccount = {
	discriminant: bigint;
	meta: {
		rentExemptReserve: bigint;
		authorized: {
			staker: Uint8Array;
			withdrawer: Uint8Array;
		};
		lockup: {
			unixTimestamp: bigint;
			epoch: bigint;
			custodian: Uint8Array;
		};
	};
	stake: {
		delegation: Delegation;
		creditsObserved: bigint;
	};
};

const WARMUP_COOLDOWN_RATE = 0.09;

export function getStakeActivatingAndDeactivating(
	delegation: Delegation,
	targetEpoch: bigint,
	stakeHistory: StakeHistoryEntry[],
): StakeActivatingAndDeactivating {
	const { effective, activating } = getStakeAndActivating(
		delegation,
		targetEpoch,
		stakeHistory,
	);

	// then de-activate some portion if necessary
	if (targetEpoch < delegation.deactivationEpoch) {
		return {
			activating,
			deactivating: BigInt(0),
			effective,
		};
	}
	if (targetEpoch === delegation.deactivationEpoch) {
		// can only deactivate what's activated
		return {
			activating: BigInt(0),
			deactivating: effective,
			effective,
		};
	}
	let currentEpoch = delegation.deactivationEpoch;
	let entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
	if (entry !== null) {
		// target_epoch > self.activation_epoch
		// loop from my deactivation epoch until the target epoch
		// current effective stake is updated using its previous epoch's cluster stake
		let currentEffectiveStake = effective;
		while (entry !== null) {
			currentEpoch++;
			// if there is no deactivating stake at prev epoch, we should have been
			// fully undelegated at this moment
			if (entry.deactivating === BigInt(0)) {
				break;
			}

			// I'm trying to get to zero, how much of the deactivation in stake
			//   this account is entitled to take
			const weight = Number(currentEffectiveStake) / Number(entry.deactivating);

			// portion of newly not-effective cluster stake I'm entitled to at current epoch
			const newlyNotEffectiveClusterStake =
				Number(entry.effective) * WARMUP_COOLDOWN_RATE;
			const newlyNotEffectiveStake = BigInt(
				Math.max(1, Math.round(weight * newlyNotEffectiveClusterStake)),
			);

			currentEffectiveStake -= newlyNotEffectiveStake;
			if (currentEffectiveStake <= 0) {
				currentEffectiveStake = BigInt(0);
				break;
			}

			if (currentEpoch >= targetEpoch) {
				break;
			}
			entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
		}

		// deactivating stake should equal to all of currently remaining effective stake
		return {
			activating: BigInt(0),
			deactivating: currentEffectiveStake,
			effective: currentEffectiveStake,
		};
	}
	return {
		activating: BigInt(0),
		deactivating: BigInt(0),
		effective: BigInt(0),
	};
}

function getStakeAndActivating(
	delegation: Delegation,
	targetEpoch: bigint,
	stakeHistory: StakeHistoryEntry[],
): EffectiveAndActivating {
	if (delegation.activationEpoch === delegation.deactivationEpoch) {
		// activated but instantly deactivated; no stake at all regardless of target_epoch
		return {
			activating: BigInt(0),
			effective: BigInt(0),
		};
	}
	if (targetEpoch === delegation.activationEpoch) {
		// all is activating
		return {
			activating: delegation.stake,
			effective: BigInt(0),
		};
	}
	if (targetEpoch < delegation.activationEpoch) {
		// not yet enabled
		return {
			activating: BigInt(0),
			effective: BigInt(0),
		};
	}

	let currentEpoch = delegation.activationEpoch;
	let entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
	if (entry !== null) {
		// target_epoch > self.activation_epoch

		// loop from my activation epoch until the target epoch summing up my entitlement
		// current effective stake is updated using its previous epoch's cluster stake
		let currentEffectiveStake = BigInt(0);
		while (entry !== null) {
			currentEpoch++;
			const remaining = delegation.stake - currentEffectiveStake;
			const weight = Number(remaining) / Number(entry.activating);
			const newlyEffectiveClusterStake =
				Number(entry.effective) * WARMUP_COOLDOWN_RATE;
			const newlyEffectiveStake = BigInt(
				Math.max(1, Math.round(weight * newlyEffectiveClusterStake)),
			);

			currentEffectiveStake += newlyEffectiveStake;
			if (currentEffectiveStake >= delegation.stake) {
				currentEffectiveStake = delegation.stake;
				break;
			}

			if (
				currentEpoch >= targetEpoch ||
				currentEpoch >= delegation.deactivationEpoch
			) {
				break;
			}
			entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
		}
		return {
			activating: delegation.stake - currentEffectiveStake,
			effective: currentEffectiveStake,
		};
	}
	// no history or I've dropped out of history, so assume fully effective
	return {
		activating: BigInt(0),
		effective: delegation.stake,
	};
}

export function getStakeHistoryEntry(
	epoch: bigint,
	stakeHistory: StakeHistoryEntry[],
): StakeHistoryEntry | null {
	for (const entry of stakeHistory) {
		if (entry.epoch === epoch) {
			return entry;
		}
	}
	return null;
}

export function getStakeHistory(
	parsedData: RpcResponseAndContext<AccountInfo<
		ParsedAccountData | Buffer
	> | null>,
): StakeHistoryEntry[] {
	if (parsedData.value === null || parsedData.value.data instanceof Buffer) {
		throw new Error("Account not found");
	}

	const stakeHistory: StakeHistoryEntry[] = [];

	for (const entry of (parsedData.value.data as ParsedAccountData).parsed
		.info) {
		stakeHistory.push({
			activating: BigInt(entry.stakeHistory.activating),
			deactivating: BigInt(entry.stakeHistory.deactivating),
			effective: BigInt(entry.stakeHistory.effective),
			epoch: BigInt(entry.epoch),
		});
	}

	return stakeHistory;
}

export function getStakeAccount(
	parsedData: RpcResponseAndContext<AccountInfo<
		ParsedAccountData | Buffer
	> | null>,
): StakeAccount {
	let discriminant = BigInt(0);
	if (parsedData.value === null || parsedData.value.data instanceof Buffer) {
		throw new Error("Account not found");
	}

	const parsed = (parsedData.value.data as ParsedAccountData).parsed;

	if (parsed.type === "delegated") {
		discriminant = BigInt(1);
	}

	return {
		discriminant: discriminant,
		meta: {
			authorized: {
				staker: parsed.info.meta.authorized.staker,
				withdrawer: parsed.info.meta.authorized.withdrawer,
			},
			lockup: {
				custodian: parsed.info.meta.lockup.custodian,
				epoch: BigInt(parsed.info.meta.lockup.epoch),
				unixTimestamp: BigInt(parsed.info.meta.lockup.unixTimestamp),
			},
			rentExemptReserve: BigInt(parsed.info.meta.rentExemptReserve),
		},
		stake: {
			creditsObserved: BigInt(parsed.info.stake.creditsObserved),
			delegation: {
				activationEpoch: BigInt(parsed.info.stake.delegation.activationEpoch),
				deactivationEpoch: BigInt(
					parsed.info.stake.delegation.deactivationEpoch,
				),
				stake: BigInt(parsed.info.stake.delegation.stake),
				voterPubkey: parsed.info.stake.delegation.voterPubkey,
			},
		},
	};
}
