"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decreaseLiquidityIx = decreaseLiquidityIx;
const spl_token_1 = require("@solana/spl-token");
function decreaseLiquidityIx(program, params) {
    const { liquidityAmount, tokenMinA, tokenMinB, whirlpool, positionAuthority, position, positionTokenAccount, tokenOwnerAccountA, tokenOwnerAccountB, tokenVaultA, tokenVaultB, tickArrayLower, tickArrayUpper, } = params;
    const ix = program.instruction.decreaseLiquidity(liquidityAmount, tokenMinA, tokenMinB, {
        accounts: {
            whirlpool,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            positionAuthority,
            position,
            positionTokenAccount,
            tokenOwnerAccountA,
            tokenOwnerAccountB,
            tokenVaultA,
            tokenVaultB,
            tickArrayLower,
            tickArrayUpper,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=decrease-liquidity-ix.js.map