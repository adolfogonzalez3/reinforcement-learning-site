
export enum EntryType {
    PREDICT,
    TRAIN
}

export interface BaseEntry {
    mtype: EntryType
}

export interface PredictEntry extends BaseEntry {
    resolve: (action: number) => void
}

export interface TrainEntry extends BaseEntry {
    resolve: (cost: number) => void
}

export function isPredictEntry(x?: BaseEntry): x is PredictEntry {
    return x?.mtype === EntryType.PREDICT
}

export function isTrainEntry(x?: BaseEntry): x is TrainEntry {
    return x?.mtype === EntryType.TRAIN
}
