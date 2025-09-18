"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kSmallestPartition = kSmallestPartition;
const RECURSION_BREAKPOINT = 600;
function kSmallestPartition(array, k, left = 0, right = array.length - 1, compare = defaultCompare) {
    while (right > left) {
        if (right - left > RECURSION_BREAKPOINT) {
            const n = right - left + 1;
            const i = k - left + 1;
            const z = Math.log(n);
            const s = 0.5 * Math.exp((2 * z) / 3);
            const sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (i - n / 2 < 0 ? -1 : 1);
            const newLeft = Math.max(left, Math.floor(k - (i * s) / n + sd));
            const newRight = Math.min(right, Math.floor(k + ((n - i) * s) / n + sd));
            kSmallestPartition(array, k, newLeft, newRight, compare);
        }
        const t = array[k];
        let i = left;
        let j = right;
        swap(array, left, k);
        if (compare(array[right], t) > 0) {
            swap(array, left, right);
        }
        while (i < j) {
            swap(array, i, j);
            i++;
            j--;
            while (compare(array[i], t) < 0) {
                i++;
            }
            while (compare(array[j], t) > 0) {
                j--;
            }
        }
        if (compare(array[left], t) === 0) {
            swap(array, left, j);
        }
        else {
            j++;
            swap(array, j, right);
        }
        if (j <= k) {
            left = j + 1;
        }
        if (k <= j) {
            right = j - 1;
        }
    }
}
function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}
function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
//# sourceMappingURL=k-smallest-partition.js.map