"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectProtocolFeesIx = collectProtocolFeesIx;
const spl_token_1 = require("@solana/spl-token");
function collectProtocolFeesIx(program, params) {
    const { whirlpoolsConfig, whirlpool, collectProtocolFeesAuthority, tokenVaultA, tokenVaultB, tokenOwnerAccountA: tokenDestinationA, tokenOwnerAccountB: tokenDestinationB, } = params;
    const ix = program.instruction.collectProtocolFees({
        accounts: {
            whirlpoolsConfig,
            whirlpool,
            collectProtocolFeesAuthority,
            tokenVaultA,
            tokenVaultB,
            tokenDestinationA,
            tokenDestinationB,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=collect-protocol-fees-ix.js.map