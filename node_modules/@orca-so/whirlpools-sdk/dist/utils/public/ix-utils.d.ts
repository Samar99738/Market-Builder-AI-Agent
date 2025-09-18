import type { Instruction } from "@orca-so/common-sdk";
import { TransactionBuilder } from "@orca-so/common-sdk";
import type { WhirlpoolContext } from "../../context";
export declare function toTx(ctx: WhirlpoolContext, ix: Instruction): TransactionBuilder;
