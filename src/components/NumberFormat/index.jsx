import { formatSat, formatNumberToKMBT } from 'common/utils';
import { BigNumber } from 'bignumber.js';
import { useMemo } from "react";



const NumberFormat = (props) => {

    const { prefix, suffix, } = props;

    const beautyNumber = useMemo(() => {
        const { value, precision = 16, kmt, isBig = false, decimal, tiny = false } = props;

        let _value = value
        if (Number.isNaN(Number(_value))) return '--'
        if (isBig && decimal) {
            if (String(_value).indexOf('.') > -1) {
                _value = formatSat(new BigNumber(_value).multipliedBy(1e8), Number(decimal) + 8)
            } else {
                _value = formatSat(new BigNumber(_value), decimal)
            }

        }
        try {
            if (tiny && Number(_value) < 0.0000001 && Number(_value) > 0) {
                let string = String(parseFloat(String(_value)));
                let ret = string.replace('.', '').match(/(\d+)e-(\d+)/);
                let left = '';
                let dex = ''
                if (ret && (ret[1] && ret[2])) {
                    left = ret[1].substring(0, precision)
                    dex = String(Number(ret[2]) - 1)
                }
                return { type: 'tiny', left: left, dex }
            }
        } catch (err) {
            return '--'
        }


        if (kmt) {
            return formatNumberToKMBT(Number(_value), precision)
        } else {
            return Number(_value).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision,
            })
        }
    }, [props])


    return <>
        {prefix}{typeof beautyNumber === 'string' ? beautyNumber : <>0.0<span style={{ fontSize: '0.8em', top: "0.2em", position: "relative" }}>
            {beautyNumber.dex}
        </span>{beautyNumber.left}
        </>}{suffix}
    </>
}

export default NumberFormat