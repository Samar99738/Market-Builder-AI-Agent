"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProtocolFeeRateIx = setProtocolFeeRateIx;
function setProtocolFeeRateIx(program, params) {
    const { whirlpoolsConfig, whirlpool, feeAuthority, protocolFeeRate } = params;
    const ix = program.instruction.setProtocolFeeRate(protocolFeeRate, {
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
//# sourceMappingURL=set-protocol-fee-rate-ix.js.map