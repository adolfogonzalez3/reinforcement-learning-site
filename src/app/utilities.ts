

export function accumulate<T,R>(src: T[], func: (prev: R, curr: T) => R, initial: R) {
    let prev = initial
    for (const curr of src) {
        prev = func(prev, curr)
    }
    return prev
}

export function gather<T>(src: T[], indices: number[]) {
    const result = []
    for (const idx of indices) {
        const val = src[idx]
        if (val !== undefined) {
            result.push(val)
        }
    }
    return result
}

export function generateRange(min: number, max: number) {
    const result = []
    for (let i = min; i < max; i++) {
        result.push(i)
    }
    return result
}

export function choicesWeighted(num: number, weights: number[]) {
    const total_sum = weights.reduce((p, c) => p + c)
    const rands = new Array(num)
    for (let i = 0; i < num; i++) {
        rands[i] = Math.random() * total_sum
    }
    
    const sorted_rands = rands.sort()
    let running_sum = 0
    const choices = new Array(num)
    for (let i = 0; i < num; i++) {

    }
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
