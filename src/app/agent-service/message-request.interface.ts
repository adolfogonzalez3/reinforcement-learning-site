
export enum RequestType {
    PREDICT,
    EXPERIENCE_REPLAY,
    TRAIN
}

export interface BaseRequest {
    mtype: RequestType
}

export interface PredictRequest extends BaseRequest {
    mtype: RequestType.PREDICT
    jobId: number
    state: number[]
}

export interface ExperienceReplayInstance {
    cstate: number[]
    reward: number
    action: number
    nstate: number[]
    terminated: boolean
}

export interface ExperienceReplayRequest extends BaseRequest {
    mtype: RequestType.EXPERIENCE_REPLAY
    data: ExperienceReplayInstance[]
}

export interface TrainRequest extends BaseRequest {
    mtype: RequestType.TRAIN
    jobId: number
}

