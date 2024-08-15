
export enum ResponseType {
    PREDICT,
    EXPERIENCE_REPLAY,
    TRAIN
}

export interface BaseResponse {
    mtype: ResponseType
}

export interface PredictResponse extends BaseResponse {
    mtype: ResponseType
    jobId: number
    action: number
}

export interface TrainResponse extends BaseResponse {
    mtype: ResponseType.TRAIN
    jobId: number
    cost: number
}