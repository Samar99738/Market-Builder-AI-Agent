"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectFeesV2Ix = collectFeesV2Ix;
const __1 = require("../..");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function collectFeesV2Ix(program, params) {
    const { whirlpool, positionAuthority, position, positionTokenAccount, tokenMintA, tokenMintB, tokenOwnerAccountA, tokenOwnerAccountB, tokenVaultA, tokenVaultB, tokenTransferHookAccountsA, tokenTransferHookAccountsB, tokenProgramA, tokenProgramB, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookA, tokenTransferHookAccountsA)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookB, tokenTransferHookAccountsB)
        .build();
    const ix = program.instruction.collectFeesV2(remainingAccountsInfo, {
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
//# sourceMappingURL=collect-fees-ix.js.map