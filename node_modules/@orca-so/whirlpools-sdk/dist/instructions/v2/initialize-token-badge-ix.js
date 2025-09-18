"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTokenBadgeIx = initializeTokenBadgeIx;
const web3_js_1 = require("@solana/web3.js");
function initializeTokenBadgeIx(program, params) {
    const { whirlpoolsConfig, whirlpoolsConfigExtension, tokenBadgeAuthority, tokenMint, tokenBadgePda, funder, } = params;
    const ix = program.instruction.initializeTokenBadge({
        accounts: {
            whirlpoolsConfig,
            whirlpoolsConfigExtension,
            tokenBadgeAuthority,
            tokenMint,
            tokenBadge: tokenBadgePda.publicKey,
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
//# sourceMappingURL=initialize-token-badge-ix.js.map