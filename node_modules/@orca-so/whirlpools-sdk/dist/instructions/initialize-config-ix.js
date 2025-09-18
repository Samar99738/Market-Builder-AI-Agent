"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeConfigIx = initializeConfigIx;
const web3_js_1 = require("@solana/web3.js");
function initializeConfigIx(program, params) {
    const { feeAuthority, collectProtocolFeesAuthority, rewardEmissionsSuperAuthority, defaultProtocolFeeRate, funder, } = params;
    const ix = program.instruction.initializeConfig(feeAuthority, collectProtocolFeesAuthority, rewardEmissionsSuperAuthority, defaultProtocolFeeRate, {
        accounts: {
            config: params.whirlpoolsConfigKeypair.publicKey,
            funder,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [params.whirlpoolsConfigKeypair],
    };
}
//# sourceMappingURL=initialize-config-ix.js.map