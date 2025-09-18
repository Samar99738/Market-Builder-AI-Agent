"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPositionWithTokenExtensionsIx = openPositionWithTokenExtensionsIx;
const __1 = require("..");
const instructions_util_1 = require("../utils/instructions-util");
function openPositionWithTokenExtensionsIx(program, params) {
    const { tickLowerIndex, tickUpperIndex, withTokenMetadataExtension } = params;
    const ix = program.instruction.openPositionWithTokenExtensions(tickLowerIndex, tickUpperIndex, withTokenMetadataExtension, {
        accounts: {
            ...(0, instructions_util_1.openPositionWithTokenExtensionsAccounts)(params),
            metadataUpdateAuth: __1.WHIRLPOOL_NFT_UPDATE_AUTH,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=open-position-with-token-extensions-ix.js.map