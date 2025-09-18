"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultProtocolFeeRateIx = setDefaultProtocolFeeRateIx;
function setDefaultProtocolFeeRateIx(program, params) {
    const { whirlpoolsConfig, feeAuthority, defaultProtocolFeeRate } = params;
    const ix = program.instruction.setDefaultProtocolFeeRate(defaultProtocolFeeRate, {
        accounts: {
            whirlpoolsConfig,
            feeAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-default-protocol-fee-rate-ix.js.map