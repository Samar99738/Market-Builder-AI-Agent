"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPositionIx = openPositionIx;
exports.openPositionWithMetadataIx = openPositionWithMetadataIx;
const __1 = require("..");
const instructions_util_1 = require("../utils/instructions-util");
function openPositionIx(program, params) {
    const { positionPda, tickLowerIndex, tickUpperIndex } = params;
    const bumps = {
        positionBump: positionPda.bump,
    };
    const ix = program.instruction.openPosition(bumps, tickLowerIndex, tickUpperIndex, {
        accounts: (0, instructions_util_1.openPositionAccounts)(params),
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
function openPositionWithMetadataIx(program, params) {
    const { positionPda, metadataPda, tickLowerIndex, tickUpperIndex } = params;
    const bumps = {
        positionBump: positionPda.bump,
        metadataBump: metadataPda.bump,
    };
    const ix = program.instruction.openPositionWithMetadata(bumps, tickLowerIndex, tickUpperIndex, {
        accounts: {
            ...(0, instructions_util_1.openPositionAccounts)(params),
            positionMetadataAccount: metadataPda.publicKey,
            metadataProgram: __1.METADATA_PROGRAM_ADDRESS,
            metadataUpdateAuth: __1.WHIRLPOOL_NFT_UPDATE_AUTH,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=open-position-ix.js.map