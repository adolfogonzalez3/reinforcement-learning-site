

export function accumulate<T,R>(src: T[], func: (prev: R, curr: T) => R, initial: R) {
    let prev = initial
    for (const curr of src) {
        prev = func(prev, curr)
    }
    return prev
}

export function gather<T>(src: T[], indices: number[]) {
    const result = new Array<T>(indices.length)
    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i]
        result[i] = src[idx]
    }
    return result
}

export function generateRangeExclusive(min: number, max: number) {
    const result = []
    for (let i = min; i < max; i++) {
        result.push(i)
    }
    return result
}

export function choicesWeighted(num: number, weights: number[]) {
    if (num >= weights.length) {
        return generateRangeExclusive(0, weights.length)
    }
    const choices = new Array<number>(num)
    const weights_indexed = weights.map((v, i) => ({w: v, idx: i}))
    let total_sum = weights.reduce((p, c) => p + c)
    for (let i = 0; i < num; i++) {
        const choice = Math.random() * total_sum
        let running_sum = 0
        for (let j = 0; j < weights_indexed.length; j++) {
            const widx = weights_indexed[j]
            running_sum += widx.w
            if (choice < running_sum) {
                choices[i] = widx.idx
                total_sum -= widx.w
                weights_indexed[j] = weights_indexed[weights_indexed.length - 1]
                weights_indexed.pop()
                break
            }
        }
    }
    return choices
}

export function ensureArray<T>(x?: T | T[]) {
    if (Array.isArray(x)) {
        return x
    }
    return x === undefined ? [] : [x]
}

export function mergeArrays<T>(...xs: T[][]) {
    const result = []
    for (const i of xs) {
        result.push(...i)
    }
    return result
}
