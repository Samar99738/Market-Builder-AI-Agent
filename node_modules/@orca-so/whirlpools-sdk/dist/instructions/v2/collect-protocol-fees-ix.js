"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectProtocolFeesV2Ix = collectProtocolFeesV2Ix;
const __1 = require("../..");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function collectProtocolFeesV2Ix(program, params) {
    const { whirlpoolsConfig, whirlpool, collectProtocolFeesAuthority, tokenMintA, tokenMintB, tokenVaultA, tokenVaultB, tokenTransferHookAccountsA, tokenTransferHookAccountsB, tokenOwnerAccountA: tokenDestinationA, tokenOwnerAccountB: tokenDestinationB, tokenProgramA, tokenProgramB, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookA, tokenTransferHookAccountsA)
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookB, tokenTransferHookAccountsB)
        .build();
    const ix = program.instruction.collectProtocolFeesV2(remainingAccountsInfo, {
        accounts: {
            whirlpoolsConfig,
            whirlpool,
            collectProtocolFeesAuthority,
            tokenMintA,
            tokenMintB,
            tokenVaultA,
            tokenVaultB,
            tokenDestinationA,
            tokenDestinationB,
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
//# sourceMappingURL=collect-protocol-fees-ix.js.map