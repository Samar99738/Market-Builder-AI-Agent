"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapV2Ix = swapV2Ix;
const public_1 = require("../../types/public");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function swapV2Ix(program, params) {
    const { amount, otherAmountThreshold, sqrtPriceLimit, amountSpecifiedIsInput, aToB, whirlpool, tokenAuthority, tokenMintA, tokenMintB, tokenOwnerAccountA, tokenVaultA, tokenOwnerAccountB, tokenVaultB, tokenTransferHookAccountsA, tokenTransferHookAccountsB, tokenProgramA, tokenProgramB, tickArray0, tickArray1, tickArray2, oracle, supplementalTickArrays, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookA, tokenTransferHookAccountsA)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookB, tokenTransferHookAccountsB)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.SupplementalTickArrays, (0, remaining_accounts_util_1.toSupplementalTickArrayAccountMetas)(supplementalTickArrays))
        .build();
    const ix = program.instruction.swapV2(amount, otherAmountThreshold, sqrtPriceLimit, amountSpecifiedIsInput, aToB, remainingAccountsInfo, {
        accounts: {
            tokenProgramA,
            tokenProgramB,
            memoProgram: public_1.MEMO_PROGRAM_ADDRESS,
            tokenAuthority: tokenAuthority,
            whirlpool,
            tokenMintA,
            tokenMintB,
            tokenOwnerAccountA,
            tokenVaultA,
            tokenOwnerAccountB,
            tokenVaultB,
            tickArray0,
            tickArray1,
            tickArray2,
            oracle,
        },
        remainingAccounts,
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=swap-ix.js.map