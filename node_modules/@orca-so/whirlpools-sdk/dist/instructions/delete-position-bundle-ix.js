"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePositionBundleIx = deletePositionBundleIx;
const spl_token_1 = require("@solana/spl-token");
function deletePositionBundleIx(program, params) {
    const { owner, positionBundle, positionBundleMint, positionBundleTokenAccount, receiver, } = params;
    const ix = program.instruction.deletePositionBundle({
        accounts: {
            positionBundle: positionBundle,
            positionBundleMint: positionBundleMint,
            positionBundleTokenAccount,
            positionBundleOwner: owner,
            receiver,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=delete-position-bundle-ix.js.map