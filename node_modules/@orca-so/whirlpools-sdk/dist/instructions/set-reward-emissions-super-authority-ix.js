"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRewardEmissionsSuperAuthorityIx = setRewardEmissionsSuperAuthorityIx;
function setRewardEmissionsSuperAuthorityIx(program, params) {
    const { whirlpoolsConfig, rewardEmissionsSuperAuthority, newRewardEmissionsSuperAuthority, } = params;
    const ix = program.instruction.setRewardEmissionsSuperAuthority({
        accounts: {
            whirlpoolsConfig,
            rewardEmissionsSuperAuthority: rewardEmissionsSuperAuthority,
            newRewardEmissionsSuperAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-reward-emissions-super-authority-ix.js.map