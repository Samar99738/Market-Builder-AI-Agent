"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultFeeRateIx = setDefaultFeeRateIx;
const public_1 = require("../utils/public");
function setDefaultFeeRateIx(program, params) {
    const { whirlpoolsConfig, feeAuthority, tickSpacing, defaultFeeRate } = params;
    const feeTierPda = public_1.PDAUtil.getFeeTier(program.programId, whirlpoolsConfig, tickSpacing);
    const ix = program.instruction.setDefaultFeeRate(defaultFeeRate, {
        accounts: {
            whirlpoolsConfig,
            feeTier: feeTierPda.publicKey,
            feeAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-default-fee-rate-ix.js.map