"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemainingAccountsBuilder = exports.RemainingAccountsType = void 0;
exports.toSupplementalTickArrayAccountMetas = toSupplementalTickArrayAccountMetas;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const public_1 = require("../types/public");
var RemainingAccountsType;
(function (RemainingAccountsType) {
    RemainingAccountsType["TransferHookA"] = "transferHookA";
    RemainingAccountsType["TransferHookB"] = "transferHookB";
    RemainingAccountsType["TransferHookReward"] = "transferHookReward";
    RemainingAccountsType["TransferHookInput"] = "transferHookInput";
    RemainingAccountsType["TransferHookIntermediate"] = "transferHookIntermediate";
    RemainingAccountsType["TransferHookOutput"] = "transferHookOutput";
    RemainingAccountsType["SupplementalTickArrays"] = "supplementalTickArrays";
    RemainingAccountsType["SupplementalTickArraysOne"] = "supplementalTickArraysOne";
    RemainingAccountsType["SupplementalTickArraysTwo"] = "supplementalTickArraysTwo";
})(RemainingAccountsType || (exports.RemainingAccountsType = RemainingAccountsType = {}));
class RemainingAccountsBuilder {
    remainingAccounts = [];
    slices = [];
    addSlice(accountsType, accounts) {
        if (!accounts || accounts.length === 0)
            return this;
        this.slices.push({
            accountsType: { [accountsType]: {} },
            length: accounts.length,
        });
        this.remainingAccounts.push(...accounts);
        return this;
    }
    build() {
        return this.slices.length === 0
            ? [null, undefined]
            : [{ slices: this.slices }, this.remainingAccounts];
    }
}
exports.RemainingAccountsBuilder = RemainingAccountsBuilder;
function toSupplementalTickArrayAccountMetas(tickArrayPubkeys) {
    if (!tickArrayPubkeys)
        return undefined;
    (0, tiny_invariant_1.default)(tickArrayPubkeys.length <= public_1.MAX_SUPPLEMENTAL_TICK_ARRAYS, "Too many supplemental tick arrays provided");
    return tickArrayPubkeys.map((pubkey) => ({
        pubkey,
        isWritable: true,
        isSigner: false,
    }));
}
//# sourceMappingURL=remaining-accounts-util.js.map