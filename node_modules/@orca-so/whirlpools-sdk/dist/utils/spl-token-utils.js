"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNativeMint = isNativeMint;
const spl_token_1 = require("@solana/spl-token");
function isNativeMint(mint) {
    return mint.equals(spl_token_1.NATIVE_MINT);
}
//# sourceMappingURL=spl-token-utils.js.map