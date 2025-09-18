"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePoolIx = initializePoolIx;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
function initializePoolIx(program, params) {
    const { initSqrtPrice, tokenMintA, tokenMintB, whirlpoolsConfig, whirlpoolPda, feeTierKey, tokenVaultAKeypair, tokenVaultBKeypair, tickSpacing, funder, } = params;
    const whirlpoolBumps = {
        whirlpoolBump: whirlpoolPda.bump,
    };
    const ix = program.instruction.initializePool(whirlpoolBumps, tickSpacing, initSqrtPrice, {
        accounts: {
            whirlpoolsConfig,
            tokenMintA,
            tokenMintB,
            funder,
            whirlpool: whirlpoolPda.publicKey,
            tokenVaultA: tokenVaultAKeypair.publicKey,
            tokenVaultB: tokenVaultBKeypair.publicKey,
            feeTier: feeTierKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
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