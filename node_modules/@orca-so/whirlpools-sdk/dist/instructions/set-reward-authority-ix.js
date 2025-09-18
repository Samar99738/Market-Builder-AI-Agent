"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRewardAuthorityIx = setRewardAuthorityIx;
function setRewardAuthorityIx(program, params) {
    const { whirlpool, rewardAuthority, newRewardAuthority, rewardIndex } = params;
    const ix = program.instruction.setRewardAuthority(rewardIndex, {
        accounts: {
            whirlpool,
            rewardAuthority,
            newRewardAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-reward-authority-ix.js.map