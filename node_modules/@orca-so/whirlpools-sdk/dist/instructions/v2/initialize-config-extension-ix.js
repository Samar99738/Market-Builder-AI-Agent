"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeConfigExtensionIx = initializeConfigExtensionIx;
const web3_js_1 = require("@solana/web3.js");
function initializeConfigExtensionIx(program, params) {
    const { whirlpoolsConfig, whirlpoolsConfigExtensionPda, funder, feeAuthority, } = params;
    const ix = program.instruction.initializeConfigExtension({
        accounts: {
            config: whirlpoolsConfig,
            configExtension: whirlpoolsConfigExtensionPda.publicKey,
            funder,
            feeAuthority,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=initialize-config-extension-ix.js.map