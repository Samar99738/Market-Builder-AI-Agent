"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWhirlpoolClient = buildWhirlpoolClient;
const whirlpool_client_impl_1 = require("./impl/whirlpool-client-impl");
function buildWhirlpoolClient(ctx) {
    return new whirlpool_client_impl_1.WhirlpoolClientImpl(ctx);
}
//# sourceMappingURL=whirlpool-client.js.map