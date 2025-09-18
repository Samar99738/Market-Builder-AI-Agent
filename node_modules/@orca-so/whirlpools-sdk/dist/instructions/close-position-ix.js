"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePositionIx = closePositionIx;
const spl_token_1 = require("@solana/spl-token");
function closePositionIx(program, params) {
    const { positionAuthority, receiver: receiver, position: position, positionMint: positionMint, positionTokenAccount, } = params;
    const ix = program.instruction.closePosition({
        accounts: {
            positionAuthority,
            receiver,
            position,
            positionMint,
            positionTokenAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=close-position-ix.js.map