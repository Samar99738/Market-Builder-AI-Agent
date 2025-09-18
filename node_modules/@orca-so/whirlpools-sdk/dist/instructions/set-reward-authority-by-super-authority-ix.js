"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRewardAuthorityBySuperAuthorityIx = setRewardAuthorityBySuperAuthorityIx;
function setRewardAuthorityBySuperAuthorityIx(program, params) {
    const { whirlpoolsConfig, whirlpool, rewardEmissionsSuperAuthority, newRewardAuthority, rewardIndex, } = params;
    const ix = program.instruction.setRewardAuthorityBySuperAuthority(rewardIndex, {
        accounts: {
            whirlpoolsConfig,
            whirlpool,
            rewardEmissionsSuperAuthority,
            newRewardAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-reward-authority-by-super-authority-ix.js.map