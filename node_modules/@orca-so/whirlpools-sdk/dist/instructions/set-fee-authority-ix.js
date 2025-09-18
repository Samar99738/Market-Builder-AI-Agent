"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeeAuthorityIx = setFeeAuthorityIx;
function setFeeAuthorityIx(program, params) {
    const { whirlpoolsConfig, feeAuthority, newFeeAuthority } = params;
    const ix = program.instruction.setFeeAuthority({
        accounts: {
            whirlpoolsConfig,
            feeAuthority,
            newFeeAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-fee-authority-ix.js.map