"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePositionWithTokenExtensionsIx = closePositionWithTokenExtensionsIx;
const spl_token_1 = require("@solana/spl-token");
function closePositionWithTokenExtensionsIx(program, params) {
    const ix = program.instruction.closePositionWithTokenExtensions({
        accounts: {
            ...params,
            token2022Program: spl_token_1.TOKEN_2022_PROGRAM_ID,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=close-position-with-token-extensions-ix.js.map