

export interface PongGameDims {
    GAME_WIDTH: number,
    GAME_HEIGHT: number,

    BALL_SIZE: number,
    PLANK_HEIGHT: number,
    PLANK_WIDTH: number,

    BALL_START_POINT_X: number,
    BALL_START_POINT_Y: number,
    BORDER: number
}

export function createPongGameDims(width: number, height: number) {
    const GAME_WIDTH = width
    const GAME_HEIGHT = height

    const BALL_SIZE = GAME_WIDTH / 150
    const PLANK_HEIGHT = GAME_HEIGHT / 5
    const PLANK_WIDTH = GAME_WIDTH / 50

    const BALL_START_POINT_X = GAME_WIDTH / 2 - BALL_SIZE
    const BALL_START_POINT_Y = GAME_HEIGHT / 2
    const BORDER = GAME_WIDTH / 50

    return {
        GAME_WIDTH,
        GAME_HEIGHT,
        BALL_SIZE,
        PLANK_HEIGHT,
        PLANK_WIDTH,
        BALL_START_POINT_X,
        BALL_START_POINT_Y,
        BORDER
    }
}