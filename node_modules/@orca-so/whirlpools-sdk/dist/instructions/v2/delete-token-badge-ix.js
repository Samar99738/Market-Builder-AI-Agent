"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTokenBadgeIx = deleteTokenBadgeIx;
function deleteTokenBadgeIx(program, params) {
    const { whirlpoolsConfig, whirlpoolsConfigExtension, tokenBadgeAuthority, tokenMint, tokenBadge, receiver, } = params;
    const ix = program.instruction.deleteTokenBadge({
        accounts: {
            whirlpoolsConfig,
            whirlpoolsConfigExtension,
            tokenBadgeAuthority,
            tokenMint,
            tokenBadge,
            receiver,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=delete-token-badge-ix.js.map