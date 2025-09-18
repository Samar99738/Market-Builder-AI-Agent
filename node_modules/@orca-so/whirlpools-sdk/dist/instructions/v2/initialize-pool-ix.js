"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePoolV2Ix = initializePoolV2Ix;
const web3_js_1 = require("@solana/web3.js");
function initializePoolV2Ix(program, params) {
    const { initSqrtPrice, tokenMintA, tokenMintB, tokenBadgeA, tokenBadgeB, tokenProgramA, tokenProgramB, whirlpoolsConfig, whirlpoolPda, feeTierKey, tokenVaultAKeypair, tokenVaultBKeypair, tickSpacing, funder, } = params;
    const ix = program.instruction.initializePoolV2(tickSpacing, initSqrtPrice, {
        accounts: {
            whirlpoolsConfig,
            tokenMintA,
            tokenMintB,
            tokenBadgeA,
            tokenBadgeB,
            funder,
            whirlpool: whirlpoolPda.publicKey,
            tokenVaultA: tokenVaultAKeypair.publicKey,
            tokenVaultB: tokenVaultBKeypair.publicKey,
            feeTier: feeTierKey,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgramA,
            tokenProgramB,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [tokenVaultAKeypair, tokenVaultBKeypair],
    };
}
//# sourceMappingURL=initialize-pool-ix.js.map