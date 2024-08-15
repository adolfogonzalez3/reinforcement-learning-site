import { Injectable } from '@angular/core'
import { BaseRequest, ExperienceReplayInstance, RequestType, PredictRequest, ExperienceReplayRequest, TrainRequest } from './message-request.interface'
import { BaseEntry, EntryType, PredictEntry, TrainEntry, isPredictEntry, isTrainEntry } from './entry.interface'
import { BaseResponse, PredictResponse, ResponseType, TrainResponse } from './message-response.interface'

@Injectable({
  providedIn: 'root'
})
export class AgentService {

  private readonly worker?: Worker
  private jobSequence: number
  private readonly promises: Map<number, BaseEntry>

  constructor() {
    this.jobSequence = 0
    this.promises = new Map
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker(new URL('./agent.worker', import.meta.url))
      this.worker.onmessage = payload => {
        // console.log(`size ${this.promises.size}`)
        const msg = payload.data as BaseResponse
        switch (msg.mtype) {
          case ResponseType.PREDICT:
            this.handlePredict(msg as PredictResponse)
            break
          case ResponseType.TRAIN:
            this.handleTrain(msg as TrainResponse)
            break
          default:
            console.log('Unknown message type encountered')
        }
      }
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  public predict(x: number[]): Promise<number> {
    const jobId = this.jobSequence++
    const promise = new Promise<number>((resolve, reject) => {
      const entry: PredictEntry = {
        mtype: EntryType.PREDICT, resolve 
       }
      this.promises.set(jobId, entry)
    })
    const msg: PredictRequest = {
      mtype: RequestType.PREDICT,
      jobId,
      state: x
    }
    this.worker?.postMessage(msg)
    return promise
  }

  public addExperienceReplay(experience: ExperienceReplayInstance[]) {
    const msg: ExperienceReplayRequest = {
      mtype: RequestType.EXPERIENCE_REPLAY,
      data: experience
    }
    this.worker?.postMessage(msg)
  }

  public train(): Promise<number> {
    const jobId = this.jobSequence++
    const promise = new Promise<number>((resolve, reject) => {
      const entry: TrainEntry = {
        mtype: EntryType.TRAIN,
        resolve
      }
      this.promises.set(jobId, entry)
    })
    const msg: TrainRequest = {
      mtype: RequestType.TRAIN,
      jobId
    }
    this.worker?.postMessage(msg)
    return promise
  }

  private handlePredict(msg: PredictResponse) {
    const { jobId, action } = msg
    const entry = this.promises.get(jobId)
    if (isPredictEntry(entry)) {
      entry.resolve(action)
      this.promises.delete(jobId)
    } else {
      console.log('Received unknown entry')
    }
  }

  private handleTrain(msg: TrainResponse) {
    const { jobId, cost } = msg
    const entry = this.promises.get(jobId)
    if (isTrainEntry(entry)) {
      entry.resolve(cost)
      this.promises.delete(jobId)
    } else {
      console.log('Received unknown entry')
    }
  }
}

