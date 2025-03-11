package database

type Database struct {
	gamestate GameState
}

type GameState string

const (
	GameStateInit     = "init"
	GameCountdown     = "countdown"
	GameStatePlaying  = "playing"
	GameStateGameover = "gameover"
)
