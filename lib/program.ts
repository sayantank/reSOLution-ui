import { PublicKey } from "@solana/web3.js";

export const programId = new PublicKey(
	"4j1DyH5Z3uVTGpDKSVBEk494Cw3MVvApCFoZHGZg9AN3",
);

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/resolution.json`.
 */
export type Resolution = {
	address: "4j1DyH5Z3uVTGpDKSVBEk494Cw3MVvApCFoZHGZg9AN3";
	metadata: {
		name: "resolution";
		version: "0.1.0";
		spec: "0.1.0";
		description: "Created with Anchor";
	};
	instructions: [
		{
			name: "approveResolution";
			discriminator: [239, 215, 26, 98, 160, 130, 11, 221];
			accounts: [
				{
					name: "signer";
					writable: true;
					signer: true;
				},
				{
					name: "owner";
					relations: ["resolutionAccount"];
				},
				{
					name: "resolutionAccount";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [114, 101, 115, 111, 108, 117, 116, 105, 111, 110];
							},
							{
								kind: "account";
								path: "owner";
							},
						];
					};
				},
			];
			args: [];
		},
		{
			name: "closeResolution";
			discriminator: [55, 199, 54, 160, 230, 86, 194, 107];
			accounts: [
				{
					name: "owner";
					writable: true;
					signer: true;
					relations: ["resolutionAccount"];
				},
				{
					name: "stakeAccount";
					writable: true;
					relations: ["resolutionAccount"];
				},
				{
					name: "resolutionAccount";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [114, 101, 115, 111, 108, 117, 116, 105, 111, 110];
							},
							{
								kind: "account";
								path: "owner";
							},
						];
					};
				},
				{
					name: "clock";
					address: "SysvarC1ock11111111111111111111111111111111";
				},
				{
					name: "stakeHistory";
					address: "SysvarStakeHistory1111111111111111111111111";
				},
				{
					name: "incineratorAccount";
					writable: true;
				},
				{
					name: "stakeProgram";
				},
			];
			args: [];
		},
		{
			name: "deactivateResolutionStake";
			discriminator: [205, 245, 135, 247, 230, 38, 47, 198];
			accounts: [
				{
					name: "owner";
					writable: true;
					signer: true;
					relations: ["resolutionAccount"];
				},
				{
					name: "stakeAccount";
					writable: true;
					relations: ["resolutionAccount"];
				},
				{
					name: "resolutionAccount";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [114, 101, 115, 111, 108, 117, 116, 105, 111, 110];
							},
							{
								kind: "account";
								path: "owner";
							},
						];
					};
				},
				{
					name: "clock";
					address: "SysvarC1ock11111111111111111111111111111111";
				},
				{
					name: "stakeProgram";
				},
			];
			args: [];
		},
		{
			name: "initializeResolution";
			discriminator: [114, 234, 73, 65, 38, 194, 180, 145];
			accounts: [
				{
					name: "owner";
					writable: true;
					signer: true;
				},
				{
					name: "resolutionAccount";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [114, 101, 115, 111, 108, 117, 116, 105, 111, 110];
							},
							{
								kind: "account";
								path: "owner";
							},
						];
					};
				},
				{
					name: "stakeAccount";
					writable: true;
					signer: true;
				},
				{
					name: "validatorVoteAccount";
				},
				{
					name: "stakeConfig";
				},
				{
					name: "rent";
					address: "SysvarRent111111111111111111111111111111111";
				},
				{
					name: "clock";
					address: "SysvarC1ock11111111111111111111111111111111";
				},
				{
					name: "stakeHistory";
					address: "SysvarStakeHistory1111111111111111111111111";
				},
				{
					name: "stakeProgram";
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [
				{
					name: "stakeAmount";
					type: "u64";
				},
				{
					name: "lockupDuration";
					type: "i64";
				},
				{
					name: "text";
					type: "string";
				},
			];
		},
	];
	accounts: [
		{
			name: "resolutionAccount";
			discriminator: [114, 112, 17, 53, 35, 50, 130, 3];
		},
	];
	errors: [
		{
			code: 6000;
			name: "customError";
			msg: "Custom error message";
		},
		{
			code: 6001;
			name: "invalidStakeProgram";
			msg: "Invalid Stake Program";
		},
		{
			code: 6002;
			name: "invalidVoteAccount";
			msg: "Invalid Vote Account";
		},
		{
			code: 6003;
			name: "invalidStakeAccount";
			msg: "Invalid Stake Account";
		},
		{
			code: 6004;
			name: "invalidNumApprovers";
			msg: "Invalid number of approvers";
		},
		{
			code: 6005;
			name: "notEnoughApprovals";
			msg: "Not enough approvals";
		},
		{
			code: 6006;
			name: "invalidApprover";
			msg: "Invalid approver";
		},
		{
			code: 6007;
			name: "alreadyApproved";
			msg: "Already approved";
		},
		{
			code: 6008;
			name: "invalidResolutionSignature";
			msg: "Invalid resolution signature";
		},
		{
			code: 6009;
			name: "lockupInForce";
			msg: "Lockup in force";
		},
	];
	types: [
		{
			name: "resolutionAccount";
			type: {
				kind: "struct";
				fields: [
					{
						name: "owner";
						type: "pubkey";
					},
					{
						name: "text";
						type: "string";
					},
					{
						name: "approvers";
						type: {
							vec: "pubkey";
						};
					},
					{
						name: "approvedBy";
						type: {
							vec: "pubkey";
						};
					},
					{
						name: "stakeAmount";
						type: "u64";
					},
					{
						name: "stakeAccount";
						type: "pubkey";
					},
					{
						name: "startTime";
						type: "i64";
					},
					{
						name: "endTime";
						type: "i64";
					},
					{
						name: "bump";
						type: "u8";
					},
				];
			};
		},
	];
	constants: [
		{
			name: "seed";
			type: "string";
			value: '"anchor"';
		},
	];
};
