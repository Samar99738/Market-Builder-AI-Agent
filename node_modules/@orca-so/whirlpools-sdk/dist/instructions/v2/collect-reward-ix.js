"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRewardV2Ix = collectRewardV2Ix;
const __1 = require("../..");
const remaining_accounts_util_1 = require("../../utils/remaining-accounts-util");
function collectRewardV2Ix(program, params) {
    const { whirlpool, positionAuthority, position, positionTokenAccount, rewardMint, rewardOwnerAccount, rewardVault, rewardTransferHookAccounts, rewardIndex, rewardTokenProgram, } = params;
    const [remainingAccountsInfo, remainingAccounts] = new remaining_accounts_util_1.RemainingAccountsBuilder()
        .addSlice(remaining_accounts_util_1.RemainingAccountsType.TransferHookReward, rewardTransferHookAccounts)
        .build();
    const ix = program.instruction.collectRewardV2(rewardIndex, remainingAccountsInfo, {
        accounts: {
            whirlpool,
            positionAuthority,
            position,
            positionTokenAccount,
            rewardMint,
            rewardOwnerAccount,
            rewardVault,
            rewardTokenProgram,
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
//# sourceMappingURL=collect-reward-ix.js.map