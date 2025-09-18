"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRewardIx = collectRewardIx;
const spl_token_1 = require("@solana/spl-token");
function collectRewardIx(program, params) {
    const { whirlpool, positionAuthority, position, positionTokenAccount, rewardOwnerAccount, rewardVault, rewardIndex, } = params;
    const ix = program.instruction.collectReward(rewardIndex, {
        accounts: {
            whirlpool,
            positionAuthority,
            position,
            positionTokenAccount,
            rewardOwnerAccount,
            rewardVault,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=collect-reward-ix.js.map