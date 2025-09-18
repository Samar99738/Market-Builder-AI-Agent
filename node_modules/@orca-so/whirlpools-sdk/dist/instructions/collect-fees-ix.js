"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectFeesIx = collectFeesIx;
const spl_token_1 = require("@solana/spl-token");
function collectFeesIx(program, params) {
    const { whirlpool, positionAuthority, position, positionTokenAccount, tokenOwnerAccountA, tokenOwnerAccountB, tokenVaultA, tokenVaultB, } = params;
    const ix = program.instruction.collectFees({
        accounts: {
            whirlpool,
            positionAuthority,
            position,
            positionTokenAccount,
            tokenOwnerAccountA,
            tokenOwnerAccountB,
            tokenVaultA,
            tokenVaultB,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=collect-fees-ix.js.map