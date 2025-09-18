"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTokenBadgeAuthorityIx = setTokenBadgeAuthorityIx;
function setTokenBadgeAuthorityIx(program, params) {
    const { whirlpoolsConfig, whirlpoolsConfigExtension, configExtensionAuthority, newTokenBadgeAuthority, } = params;
    const ix = program.instruction.setTokenBadgeAuthority({
        accounts: {
            whirlpoolsConfig,
            whirlpoolsConfigExtension,
            configExtensionAuthority,
            newTokenBadgeAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-token-badge-authority-ix.js.map