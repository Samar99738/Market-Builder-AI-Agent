"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoHopSwapV2Ix = twoHopSwapV2Ix;
const public_1 = require("../../types/public");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function twoHopSwapV2Ix(program, params) {
    const { amount, otherAmountThreshold, amountSpecifiedIsInput, aToBOne, aToBTwo, sqrtPriceLimitOne, sqrtPriceLimitTwo, whirlpoolOne, whirlpoolTwo, tokenMintInput, tokenMintIntermediate, tokenMintOutput, tokenProgramInput, tokenProgramIntermediate, tokenProgramOutput, tokenVaultOneInput, tokenVaultOneIntermediate, tokenVaultTwoIntermediate, tokenVaultTwoOutput, tokenAuthority, tokenTransferHookAccountsInput, tokenTransferHookAccountsIntermediate, tokenTransferHookAccountsOutput, tokenOwnerAccountInput, tokenOwnerAccountOutput, tickArrayOne0, tickArrayOne1, tickArrayOne2, tickArrayTwo0, tickArrayTwo1, tickArrayTwo2, oracleOne, oracleTwo, supplementalTickArraysOne, supplementalTickArraysTwo, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookInput, tokenTransferHookAccountsInput)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookIntermediate, tokenTransferHookAccountsIntermediate)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookOutput, tokenTransferHookAccountsOutput)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.SupplementalTickArraysOne, (0, remaining_accounts_util_1.toSupplementalTickArrayAccountMetas)(supplementalTickArraysOne))
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.SupplementalTickArraysTwo, (0, remaining_accounts_util_1.toSupplementalTickArrayAccountMetas)(supplementalTickArraysTwo))
        .build();
    const ix = program.instruction.twoHopSwapV2(amount, otherAmountThreshold, amountSpecifiedIsInput, aToBOne, aToBTwo, sqrtPriceLimitOne, sqrtPriceLimitTwo, remainingAccountsInfo, {
        accounts: {
            whirlpoolOne,
            whirlpoolTwo,
            tokenMintInput,
            tokenMintIntermediate,
            tokenMintOutput,
            tokenProgramInput,
            tokenProgramIntermediate,
            tokenProgramOutput,
            tokenOwnerAccountInput,
            tokenVaultOneInput,
            tokenVaultOneIntermediate,
            tokenVaultTwoIntermediate,
            tokenVaultTwoOutput,
            tokenOwnerAccountOutput,
            tokenAuthority,
            tickArrayOne0,
            tickArrayOne1,
            tickArrayOne2,
            tickArrayTwo0,
            tickArrayTwo1,
            tickArrayTwo2,
            oracleOne,
            oracleTwo,
            memoProgram: public_1.MEMO_PROGRAM_ADDRESS,
        },
        remainingAccounts,
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=two-hop-swap-ix.js.map