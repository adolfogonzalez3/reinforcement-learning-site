import {
  type AfterViewInit,
  Component,
  ViewChild,
  type ElementRef,
} from "@angular/core";
import {
  Bodies,
  Body,
  Composite,
  Engine,
  type IBodyDefinition,
  type IChamferableBodyDefinition,
  Render,
  type Runner,
  Vector,
  Events,
} from "matter-js";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AgentService } from "../agent-service/agent.service";

import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { mergeArrays } from "../utilities";
import {
  createPongGameDims,
  type PongGameDims,
} from "./pong-game-dims.interface";

@Component({
  selector: "app-pong-game",
  standalone: true,
  imports: [],
  templateUrl: "./pong-game.component.html",
  styleUrl: "./pong-game.component.scss",
})
export class PongGameComponent implements AfterViewInit {
  private readonly engine?: Engine;
  private readonly runner?: Runner;
  private readonly renderer?: Render;
  private readonly gameDims: PongGameDims;
  private chart?: Chart;
  private trainingIteration: number;
  private cstates: number[][];
  private maxSteps: number;

  public widthX: number;
  public velocityX: number;
  public rotation: number;
  public randomRate: number;
  public cost: number;
  public terminated: boolean;
  public hasWon: boolean;
  public currentSteps: number;
  public currentGameSteps: number;
  public currentGameNum: number;
  public rendering: boolean;
  public wins: number;
  public losses: number;
  public timeouts: number;

  @ViewChild("canvas")
  private readonly canvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild("chart")
  private readonly chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private readonly agentService: AgentService) {
    this.gameDims = createPongGameDims(650 / 2, 340 / 2);
    this.widthX = 0;
    this.velocityX = 0;
    this.rotation = 0;
    this.trainingIteration = 0;
    this.cstates = [];
    this.randomRate = 0.8;
    this.cost = 0;
    this.terminated = false;
    this.hasWon = false;
    this.maxSteps = 50_000
    this.currentSteps = 0
    this.currentGameSteps = 0
    this.currentGameNum = 0
    this.rendering = false
    this.wins = 0
    this.losses = 0
    this.timeouts = 0
    Chart.register(
      CategoryScale,
      LinearScale,
      LineController,
      LineElement,
      PointElement,
    );
  }

  public ngAfterViewInit(): void {
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Acquisitions by year",
            data: [],
          },
        ],
      },
      options: {

      }
    });

    const plankSettings: IChamferableBodyDefinition = {
      isStatic: true,
      // restitution: 1.0,
      // friction: 0
    };

    const wallSettings: IChamferableBodyDefinition = {
      isStatic: true,
      // restitution: 1.0,
    };

    const ballSettings: IBodyDefinition = {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      // restitution: 1.0,
    };
    const ball = Bodies.circle(
      this.gameDims.BALL_START_POINT_X,
      this.gameDims.BALL_START_POINT_Y,
      this.gameDims.BALL_SIZE,
      {
        ...ballSettings,
        label: "ball",
      },
    );

    const plankOne = Bodies.trapezoid(
      this.gameDims.BORDER * 2 + this.gameDims.PLANK_WIDTH / 2,
      this.gameDims.BALL_START_POINT_Y,
      this.gameDims.PLANK_HEIGHT,
      this.gameDims.PLANK_WIDTH,
      0.25,
      {
        ...plankSettings,
        label: "plankOne",
        angle: Math.PI / 2
      },
    );
    const plankTwo = Bodies.rectangle(
      this.gameDims.GAME_WIDTH -
        (this.gameDims.BORDER * 2 + this.gameDims.PLANK_WIDTH / 2),
      this.gameDims.BALL_START_POINT_Y,
      this.gameDims.PLANK_WIDTH,
      this.gameDims.PLANK_HEIGHT,
      { ...plankSettings, label: "plankTwo" },
    );

    const topWall = Bodies.rectangle(
      this.gameDims.GAME_WIDTH / 2,
      this.gameDims.BORDER / 2,
      this.gameDims.GAME_WIDTH,
      this.gameDims.BORDER,
      { ...wallSettings, label: "topWall" },
    );
    const bottomWall = Bodies.rectangle(
      this.gameDims.GAME_WIDTH / 2,
      this.gameDims.GAME_HEIGHT - this.gameDims.BORDER / 2,
      this.gameDims.GAME_WIDTH,
      this.gameDims.BORDER,
      { ...wallSettings, label: "bottomWall" },
    );
    const leftWall = Bodies.rectangle(
      this.gameDims.BORDER / 2,
      this.gameDims.GAME_HEIGHT / 2,
      this.gameDims.BORDER,
      this.gameDims.GAME_HEIGHT,
      { ...wallSettings, isSensor: true, label: "leftWall" },
    );
    const rightWall = Bodies.rectangle(
      this.gameDims.GAME_WIDTH - this.gameDims.BORDER / 2,
      this.gameDims.GAME_HEIGHT / 2,
      this.gameDims.BORDER,
      this.gameDims.GAME_HEIGHT,
      { ...wallSettings, isSensor: true, label: "rightWall" },
    );
    const sideWalls = new Set([leftWall.label, rightWall.label]);
    const bounceWalls = new Set([topWall.label, bottomWall.label]);

    const planks = new Set([plankOne.label, plankTwo.label]);
    const engine = Engine.create({
      gravity: {
        y: 0,
        x: 0.0,
      },
    });

    Composite.add(engine.world, [
      ball,
      plankOne,
      plankTwo,
      topWall,
      bottomWall,
      leftWall,
      rightWall,
    ]);

    Body.setVelocity(ball, Vector.create(-1, -1));

    const reset = () => {
      Body.setPosition(
        ball,
        Vector.create(
          this.gameDims.BALL_START_POINT_X,
          this.gameDims.BALL_START_POINT_Y,
        ),
      );
      Body.setPosition(
        plankOne,
        Vector.create(
          plankOne.position.x,
          this.gameDims.BALL_START_POINT_Y,
        ),
      );
      Body.setPosition(
        plankTwo,
        Vector.create(
          plankTwo.position.x,
          this.gameDims.BALL_START_POINT_Y,
        ),
      );
      const dir = Math.random() > 0.5 ? 1 : -1;
      const ydir = Math.random() * 0.6 - 0.3
      Body.setVelocity(ball, Vector.create(dir, ydir));
      this.currentSteps = 0
    }

    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (
          sideWalls.has(pair.bodyA.label) ||
          sideWalls.has(pair.bodyB.label)
        ) {
          reset()
          this.terminated = true;
          this.hasWon =
            rightWall.label === pair.bodyA.label ||
            rightWall.label === pair.bodyB.label;
          this.wins += this.hasWon ? 1 : 0
          this.losses += this.hasWon ? 0 : 1
        } else if (
          planks.has(pair.bodyA.label) ||
          planks.has(pair.bodyB.label)
        ) {
          const ballVelocity = Body.getVelocity(ball);
          Body.setVelocity(
            ball,
            Vector.create(-ballVelocity.x, ballVelocity.y),
          );
        } else if (
          bounceWalls.has(pair.bodyA.label) ||
          bounceWalls.has(pair.bodyB.label)
        ) {
          const ballVelocity = Body.getVelocity(ball);
          Body.setVelocity(
            ball,
            Vector.create(ballVelocity.x, -ballVelocity.y),
          );
        }
      });
    });

    // Body.setVelocity(ball, Vector.create(5, 0))

    const renderer = Render.create({
      canvas: this.canvas.nativeElement,
      engine,
      options: {
        height: this.gameDims.GAME_HEIGHT,
        width: this.gameDims.GAME_WIDTH,
      },
    });

    // Render.run(renderer);

    // const runner = Runner.create()
    const performAction = (action: number) => {
      const x = plankOne.position.x;
      const y = plankOne.position.y + 0.1 * (action === 0 ? 1 : -1);
      const MIN_PLANK_HEIGHT =
        this.gameDims.BORDER + this.gameDims.PLANK_HEIGHT / 2;
      const MAX_PLANK_HEIGHT =
        this.gameDims.GAME_HEIGHT -
        this.gameDims.BORDER -
        this.gameDims.PLANK_HEIGHT / 2;
      const boundedY = Math.max(
        Math.min(MAX_PLANK_HEIGHT, y),
        MIN_PLANK_HEIGHT,
      );
      Body.setPosition(plankOne, Vector.create(x, boundedY));
      if (ball.speed < 1) {
        Body.setSpeed(ball, 1)
      }
      const cpuDist = ball.position.y - plankTwo.position.y
      Body.setPosition(plankTwo, 
        Vector.create(
          plankTwo.position.x,
          Math.max(
            Math.min(MAX_PLANK_HEIGHT,
              plankTwo.position.y + 0.05 * Math.sign(cpuDist)
            ),
            MIN_PLANK_HEIGHT,
          )
        )
      )
      // Vector.
      // Vector.clone(ball.velocity)
      // Body.setVelocity(ball, )
      Engine.update(engine, 4);
      
      this.widthX = ball.position.x
      this.velocityX = ball.velocity.x
      this.rotation = ball.angularVelocity
      // Runner.tick(runner, engine, 1)
      this.currentSteps += 1
      if (this.currentSteps >= this.maxSteps) {
        reset()
        this.terminated = true;
        this.hasWon = false;
        this.timeouts += 1
      }
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const agentLoop = async () => {
      const skip = 10_000;
      let iteration = 0;
      while (true) {
        const cstate_i = [
          plankOne.position.x / this.gameDims.GAME_WIDTH - 0.5,
          plankOne.position.y / this.gameDims.GAME_HEIGHT - 0.5,
          plankTwo.position.x / this.gameDims.GAME_WIDTH - 0.5,
          plankTwo.position.y / this.gameDims.GAME_HEIGHT - 0.5,
          ball.position.x / this.gameDims.GAME_WIDTH - 0.5,
          ball.position.y / this.gameDims.GAME_HEIGHT - 0.5,
        ];
        if (this.cstates.length === 0) {
          this.cstates = [cstate_i, cstate_i, cstate_i, cstate_i];
        } else {
          this.cstates.push(cstate_i);
          this.cstates.shift();
        }
        if (iteration > skip) {
          this.randomRate = Math.max(this.randomRate * (1 - 1e-5), 1e-1);
        }
        const cstate = mergeArrays(...this.cstates);
        let action: number;
        if (iteration < skip || this.randomRate > Math.random()) {
          action = Math.random() > 0.5 ? 1 : 0;
        } else {
          action = await this.agentService.predict(cstate);
        }
        for (let i = 0; i < 64; i++) {
          performAction(action);
        }
        this.currentGameSteps += 1
        if (iteration > skip && this.currentGameNum % 200 < 3) {
          if (!this.rendering) {
            Render.run(renderer)
            this.rendering = true
          }
          await sleep(100)
        } else if (this.rendering) {
          Render.stop(renderer)
          this.rendering = false
        }
        const nstate_i = [
          plankOne.position.x / this.gameDims.GAME_WIDTH - 0.5,
          plankOne.position.y / this.gameDims.GAME_HEIGHT - 0.5,
          plankTwo.position.x / this.gameDims.GAME_WIDTH - 0.5,
          plankTwo.position.y / this.gameDims.GAME_HEIGHT - 0.5,
          ball.position.x / this.gameDims.GAME_WIDTH - 0.5,
          ball.position.y / this.gameDims.GAME_HEIGHT - 0.5,
        ];
        const nstate = mergeArrays(...this.cstates.slice(1), nstate_i);

        this.agentService.addExperienceReplay([
          {
            cstate,
            reward: this.terminated ? (this.hasWon ? 10 : -10) : 1,
            action,
            nstate,
            terminated: this.terminated,
          },
        ]);
        if (this.terminated) {
          this.terminated = false;
          this.currentGameSteps = 0
          this.currentGameNum += 1
        }
        if (iteration > skip && iteration % 32 === 0 && !this.rendering) {
          this.cost = await this.agentService.train();
          if (this.chart === undefined) {
            return;
          }
          if ((this.chart.data.labels?.length ?? 0) >= 50) {
            this.chart.data.labels?.shift();
            this.chart.data.datasets.forEach((dataset) => dataset.data.shift());
          }
          this.chart.data.labels?.push(this.trainingIteration);
          this.chart.data.datasets.forEach((dataset) =>
            dataset.data.push(this.cost),
          );
          // this.chart.update();
          this.chart.update('resize')
          this.trainingIteration += 1;
        }
        iteration += 1;
      }
    };

    void agentLoop();

    // next: add code for binding to events for syncing the UI
  }

  // public restart() {
  //   Body.setPosition(ball, Vector.create(BALL_START_POINT_X, BALL_START_POINT_Y))
  //   Body.setAngle(ball, 75)
  //   Body.setSpeed(ball, 1)
  //   Body.setPosition(plankOne, Vector.create(plankOne.position.x, BALL_START_POINT_Y))
  //   Body.setPosition(plankTwo, Vector.create(plankTwo.position.x, BALL_START_POINT_Y))
  //   Body.setVelocity(ball, Vector.create(-1, -1))
  // }
}
