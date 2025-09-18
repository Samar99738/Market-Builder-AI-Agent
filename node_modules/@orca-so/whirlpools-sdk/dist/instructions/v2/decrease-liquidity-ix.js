"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decreaseLiquidityV2Ix = decreaseLiquidityV2Ix;
const __1 = require("../..");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function decreaseLiquidityV2Ix(program, params) {
    const { liquidityAmount, tokenMinA, tokenMinB, whirlpool, positionAuthority, position, positionTokenAccount, tokenMintA, tokenMintB, tokenOwnerAccountA, tokenOwnerAccountB, tokenVaultA, tokenVaultB, tokenTransferHookAccountsA, tokenTransferHookAccountsB, tokenProgramA, tokenProgramB, tickArrayLower, tickArrayUpper, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookA, tokenTransferHookAccountsA)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookB, tokenTransferHookAccountsB)
        .build();
    const ix = program.instruction.decreaseLiquidityV2(liquidityAmount, tokenMinA, tokenMinB, remainingAccountsInfo, {
        accounts: {
            whirlpool,
            positionAuthority,
            position,
            positionTokenAccount,
            tokenMintA,
            tokenMintB,
            tokenOwnerAccountA,
            tokenOwnerAccountB,
            tokenVaultA,
            tokenVaultB,
            tokenProgramA,
            tokenProgramB,
            tickArrayLower,
            tickArrayUpper,
            memoProgram: __1.MEMO_PROGRAM_ADDRESS,
        },
        remainingAccounts,
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=decrease-liquidity-ix.js.map