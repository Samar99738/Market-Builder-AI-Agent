import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { TickArrayData, WhirlpoolRewardInfoData } from "./anchor-types";
import type { AccountWithTokenProgram, MintWithTokenProgram } from "@orca-so/common-sdk";
export type TokenInfo = MintWithTokenProgram & {
    mint: PublicKey;
};
export type TokenAccountInfo = AccountWithTokenProgram;
export type WhirlpoolRewardInfo = WhirlpoolRewardInfoData & {
    initialized: boolean;
    vaultAmount: BN;
};
export type TickArray = {
    address: PublicKey;
    startTickIndex: number;
    data: TickArrayData | null;
};
