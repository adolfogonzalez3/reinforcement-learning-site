/// <reference lib="webworker" />

import {
  sequential,
  layers,
  train,
  type Sequential,
  util,
  expandDims,
  concat,
  type Tensor,
  type Rank,
  losses,
  max,
  mul,
  add,
  oneHot,
  sum,
  argMax,
  squeeze,
  tensor,
  buffer,
  sub,
  exp,
  pow,
} from "@tensorflow/tfjs";
import {
  type BaseRequest,
  type ExperienceReplayInstance,
  type ExperienceReplayRequest,
  RequestType,
  type PredictRequest,
  type TrainRequest,
} from "./message-request.interface";
import { choicesWeighted, gather, generateRangeExclusive } from "../utilities";
import {
  type PredictResponse,
  ResponseType,
  type TrainResponse,
} from "./message-response.interface";


function qlearningModel(): Sequential {
  const m = sequential();
  m.add(
    layers.dense({
      units: 32,
      activation: "gelu_new",
      inputShape: [6 * 4],
      kernelInitializer: "glorotNormal",
      kernelRegularizer: "l1l2",
    }),
  );
  m.add(layers.batchNormalization());
  m.add(
    layers.dense({
      units: 32,
      activation: "gelu_new",
      kernelInitializer: "glorotNormal",
      kernelRegularizer: "l1l2",
    }),
  );
  m.add(layers.batchNormalization());
  m.add(
    layers.dense({
      units: 2,
      kernelInitializer: "glorotNormal",
    }),
  );
  return m;
}

const max_num_experiences = 100_000
const experiences: ExperienceReplayInstance[] = new Array(max_num_experiences);
const exp_weights: number[] = new Array(max_num_experiences)
const feature_num = 32
let current_num_experiences = 0
let current_experience_ptr = 0

let steps = 0

// Create a simple model.
let online = qlearningModel();
let target = qlearningModel();

async function predict(msg: PredictRequest): Promise<PredictResponse> {
  const { jobId, state } = msg;
  const stateT = expandDims(state);
  const pred = target.predict(stateT) as Tensor<Rank>;
  const y = squeeze(argMax(pred, 1));
  return {
    mtype: ResponseType.PREDICT,
    jobId,
    action: await y.array().then((x) => x as number),
  };
}

async function addExperienceReplay(
  msg: ExperienceReplayRequest,
): Promise<void> {
  for (let i = 0; i < msg.data.length; i++) {
    const idx = (current_experience_ptr + i) % max_num_experiences
    experiences[idx] = msg.data[i]
    exp_weights[idx] = 100
  }
  current_num_experiences = Math.min(
    current_num_experiences + msg.data.length,
    max_num_experiences
  )
  current_experience_ptr = (current_experience_ptr + msg.data.length) % max_num_experiences
  // if (experiences.length >= current_num_experiences + msg.data.length) {
  //   experiences.splice(0, msg.data.length);
  //   const remaining_space = max_num_experiences - current_num_experiences
  //   for (let i = 0; i < remaining_space; i++) {
  //     experiences[current_num_experiences + i] = msg.data[i]
  //   }
  //   const left_over = msg.data.length - remaining_space
  //   for (let i = 0; i < left_over; i++) {
  //     experiences[i] = msg.data[remaining_space + i]
  //   }
  //   current_num_experiences = max_num_experiences
  //   current_experience_ptr += left_over
  // } else {
  //   for (let i = 0; i < msg.data.length; i++) {
  //     experiences[(current_num_experiences + i) % max_num_experiences] = msg.data[i]
  //   }
  //   current_num_experiences += msg.data.length
  //   current_experience_ptr += msg.data.length
  // }
}

const optimizer = train.adam(1e-3);

async function trainModel(msg: TrainRequest): Promise<TrainResponse> {
  steps += 1
  const { jobId } = msg;
  if (current_num_experiences === 0) {
    return { mtype: ResponseType.TRAIN, jobId, cost: Infinity };
  }
  const indices = choicesWeighted(64, exp_weights.slice(0, current_num_experiences))
  const batch = gather(experiences, indices);
  const cstates: Tensor[] = [];
  const actions: number[] = [];
  const rewards: Tensor[] = [];
  const nstates: Tensor[] = [];
  const terminates: Tensor[] = [];
  for (const exp of batch) {
    cstates.push(expandDims(exp.cstate));
    actions.push(exp.action);
    rewards.push(expandDims([exp.reward]));
    nstates.push(expandDims(exp.nstate));
    terminates.push(expandDims([exp.terminated ? 0 : 1]));
  }
  const cstatesT = concat(cstates);
  const rewardsT = concat(rewards);
  const nstatesT = concat(nstates);
  const terminatesT = concat(terminates);

  // if (steps !== 0 && steps % 200 === 0) {
  //   online = qlearningModel()
  //   target = qlearningModel()
  //   console.log('RESET')
  // }
  
  const cost =
    (await optimizer
      .minimize(() => {
        const qvalues = online.predict(cstatesT) as Tensor<Rank>;
        const qvalues_max = sum(mul(qvalues, oneHot(actions, 2)), 1, true);
        const qvalues_next = target.predict(nstatesT) as Tensor<Rank>;
        const qvalues_next_max = max(qvalues_next, 1, true);
        const qexpect = add(
          rewardsT,
          mul(terminatesT, mul([1 - 1e-1], qvalues_next_max)),
        );
        return losses.meanSquaredError(qexpect, qvalues_max);
      }, true)
      ?.array()) ?? 0;
  
  const qvalues = online.predict(cstatesT) as Tensor<Rank>;
    const qvalues_max = sum(mul(qvalues, oneHot(actions, 2)), 1, true);
    const qvalues_next = target.predict(nstatesT) as Tensor<Rank>;
    const qvalues_next_max = max(qvalues_next, 1, true);
    const qexpect = add(
      rewardsT,
      mul(terminatesT, mul([1 - 1e-1], qvalues_next_max)),
    );
  const loss_arr = await pow(sub(qexpect, qvalues_max), 2).array() as number[][]
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]
    exp_weights[idx] = loss_arr[i][0]
  }

  const targetWgt = target.getWeights();
  const onlineWgt = online.getWeights();
  if (targetWgt.length !== onlineWgt.length) {
    console.log("THERE IS SOMETHING WRONG");
  }
  const newWgt: Tensor<Rank>[] = new Array(targetWgt.length);
  for (let i = 0; i < targetWgt.length; i++) {
    const twgt = targetWgt[i];
    const owgt = onlineWgt[i];
    newWgt[i] = add(mul(twgt, [0.99]), mul(owgt, [0.01]))
  }
  target.setWeights(newWgt);

  return { mtype: ResponseType.TRAIN, jobId, cost };
}

addEventListener("message", (payload) => {
  const request = payload.data as BaseRequest;
  switch (request.mtype) {
    case RequestType.PREDICT:
      void predict(request as PredictRequest).then((r) => {
        postMessage(r);
      });
      // const response = await predict(request as PredictRequest)
      // postMessage(response)
      break;
    case RequestType.EXPERIENCE_REPLAY:
      void addExperienceReplay(request as ExperienceReplayRequest);
      break;
    case RequestType.TRAIN:
      void trainModel(request as TrainRequest).then((r) => {
        postMessage(r);
      });
      break;
    default:
      console.log("Unknown message type encountered");
  }
});
