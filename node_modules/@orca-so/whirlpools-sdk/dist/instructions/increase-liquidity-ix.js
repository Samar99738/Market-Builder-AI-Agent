"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.increaseLiquidityIx = increaseLiquidityIx;
const spl_token_1 = require("@solana/spl-token");
function increaseLiquidityIx(program, params) {
    const { liquidityAmount, tokenMaxA, tokenMaxB, whirlpool, positionAuthority, position, positionTokenAccount, tokenOwnerAccountA, tokenOwnerAccountB, tokenVaultA, tokenVaultB, tickArrayLower, tickArrayUpper, } = params;
    const ix = program.instruction.increaseLiquidity(liquidityAmount, tokenMaxA, tokenMaxB, {
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
//# sourceMappingURL=increase-liquidity-ix.js.map