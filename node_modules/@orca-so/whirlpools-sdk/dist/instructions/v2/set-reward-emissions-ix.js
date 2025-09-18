"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRewardEmissionsV2Ix = setRewardEmissionsV2Ix;
function setRewardEmissionsV2Ix(program, params) {
    const { rewardAuthority, whirlpool, rewardIndex, rewardVaultKey: rewardVault, emissionsPerSecondX64, } = params;
    const ix = program.instruction.setRewardEmissionsV2(rewardIndex, emissionsPerSecondX64, {
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