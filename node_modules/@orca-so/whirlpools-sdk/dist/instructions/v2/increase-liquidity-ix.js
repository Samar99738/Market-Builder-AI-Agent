"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.increaseLiquidityV2Ix = increaseLiquidityV2Ix;
const __1 = require("../..");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function increaseLiquidityV2Ix(program, params) {
    const { liquidityAmount, tokenMaxA, tokenMaxB, whirlpool, positionAuthority, position, positionTokenAccount, tokenMintA, tokenMintB, tokenOwnerAccountA, tokenOwnerAccountB, tokenVaultA, tokenVaultB, tokenTransferHookAccountsA, tokenTransferHookAccountsB, tokenProgramA, tokenProgramB, tickArrayLower, tickArrayUpper, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookA, tokenTransferHookAccountsA)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookB, tokenTransferHookAccountsB)
        .build();
    const ix = program.instruction.increaseLiquidityV2(liquidityAmount, tokenMaxA, tokenMaxB, remainingAccountsInfo, {
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
//# sourceMappingURL=increase-liquidity-ix.js.map