"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRewardEmissionsIx = setRewardEmissionsIx;
function setRewardEmissionsIx(program, params) {
    const { rewardAuthority, whirlpool, rewardIndex, rewardVaultKey: rewardVault, emissionsPerSecondX64, } = params;
    const ix = program.instruction.setRewardEmissions(rewardIndex, emissionsPerSecondX64, {
        accounts: {
            rewardAuthority,
            whirlpool,
            rewardVault,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-reward-emissions-ix.js.map