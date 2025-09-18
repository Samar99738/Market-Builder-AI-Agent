"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfigExtensionAuthorityIx = setConfigExtensionAuthorityIx;
function setConfigExtensionAuthorityIx(program, params) {
    const { whirlpoolsConfig, whirlpoolsConfigExtension, configExtensionAuthority, newConfigExtensionAuthority, } = params;
    const ix = program.instruction.setConfigExtensionAuthority({
        accounts: {
            whirlpoolsConfig,
            whirlpoolsConfigExtension,
            configExtensionAuthority,
            newConfigExtensionAuthority,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=set-config-extension-authority-ix.js.map