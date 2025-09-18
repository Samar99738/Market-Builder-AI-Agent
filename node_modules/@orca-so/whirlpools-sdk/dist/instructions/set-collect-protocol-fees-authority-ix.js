"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCollectProtocolFeesAuthorityIx = setCollectProtocolFeesAuthorityIx;
function setCollectProtocolFeesAuthorityIx(program, params) {
    const { whirlpoolsConfig, collectProtocolFeesAuthority, newCollectProtocolFeesAuthority, } = params;
    const ix = program.instruction.setCollectProtocolFeesAuthority({
        accounts: {
            whirlpoolsConfig,
            collectProtocolFeesAuthority,
            newCollectProtocolFeesAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-collect-protocol-fees-authority-ix.js.map