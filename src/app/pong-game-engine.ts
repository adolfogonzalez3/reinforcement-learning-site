import Matter, { Runner } from "matter-js";

export class PongGameEngine {


    constructor() {
        var engine = Matter.Engine.create();
        // create two boxes and a ground
        var boxA = Matter.Bodies.rectangle(400, 200, 80, 80);
        var boxB = Matter.Bodies.rectangle(450, 50, 80, 80);
        var ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

        // add all of the bodies to the world
        Matter.Composite.add(engine.world, [boxA, boxB, ground]);
        var runner = Runner.create();
        Runner.run(runner, engine);
        // Runner.tick(runner, engine, 1);
    }
}