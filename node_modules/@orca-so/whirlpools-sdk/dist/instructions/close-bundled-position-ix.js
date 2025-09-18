"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeBundledPositionIx = closeBundledPositionIx;
function closeBundledPositionIx(program, params) {
    const { bundledPosition, positionBundle, positionBundleTokenAccount, positionBundleAuthority, bundleIndex, receiver, } = params;
    const ix = program.instruction.closeBundledPosition(bundleIndex, {
        accounts: {
            bundledPosition,
            positionBundle,
            positionBundleTokenAccount,
            positionBundleAuthority,
            receiver,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=close-bundled-position-ix.js.map