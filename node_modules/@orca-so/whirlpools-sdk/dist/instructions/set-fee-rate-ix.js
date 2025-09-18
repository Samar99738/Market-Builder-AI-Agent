"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeeRateIx = setFeeRateIx;
function setFeeRateIx(program, params) {
    const { whirlpoolsConfig, whirlpool, feeAuthority, feeRate } = params;
    const ix = program.instruction.setFeeRate(feeRate, {
        accounts: {
            whirlpoolsConfig,
            whirlpool,
            feeAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-fee-rate-ix.js.map