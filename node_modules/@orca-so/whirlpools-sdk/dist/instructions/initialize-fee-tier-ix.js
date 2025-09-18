"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFeeTierIx = initializeFeeTierIx;
const web3_js_1 = require("@solana/web3.js");
function initializeFeeTierIx(program, params) {
    const { feeTierPda, whirlpoolsConfig, tickSpacing, feeAuthority, defaultFeeRate, funder, } = params;
    const ix = program.instruction.initializeFeeTier(tickSpacing, defaultFeeRate, {
        accounts: {
            config: whirlpoolsConfig,
            feeTier: feeTierPda.publicKey,
            feeAuthority,
            funder,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=initialize-fee-tier-ix.js.map