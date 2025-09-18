"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeesAndRewardsIx = updateFeesAndRewardsIx;
function updateFeesAndRewardsIx(program, params) {
    const { whirlpool, position, tickArrayLower, tickArrayUpper } = params;
    const ix = program.instruction.updateFeesAndRewards({
        accounts: {
            whirlpool,
            position,
            tickArrayLower,
            tickArrayUpper,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=update-fees-and-rewards-ix.js.map