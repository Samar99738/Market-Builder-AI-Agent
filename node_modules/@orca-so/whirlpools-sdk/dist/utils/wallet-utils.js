"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWalletConnected = isWalletConnected;
const web3_js_1 = require("@solana/web3.js");
function isWalletConnected(wallet) {
    return wallet !== null && !wallet.publicKey.equals(web3_js_1.PublicKey.default);
}
//# sourceMappingURL=wallet-utils.js.map