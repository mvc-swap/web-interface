
import BigNumber from 'bignumber.js';
BigNumber.config({ EXPONENTIAL_AT: 999999,DECIMAL_PLACES: 40 })
export function assert(value: boolean, msg?: string) {
    if (!value) {
        throw new Error(msg)
    }
}

export function toUint256(value: bigint) {
    return value & BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
}

export function sqrtX96ToPrice(sqrtPriceX96: bigint) {
    const res = Number(sqrtPriceX96) / (2 ** 96)
    return res * res
}

export function priceToSqrtX96(price:number) {
    const res = new BigNumber(Math.sqrt(price)).multipliedBy(new BigNumber('1e20'));
    // console.log(res.toString())
    const bigTwo = new BigNumber(2);
    const big96 = new BigNumber(96);
    const big1e20 = new BigNumber('1e20');
    return res.multipliedBy(bigTwo.pow(big96)).dividedBy(big1e20);
}

