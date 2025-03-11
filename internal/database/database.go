package database

import (
	"github.com/google/uuid"
)

type GameState string

const (
	GameStateInit     = "init"
	GameCountdown     = "countdown"
	GameStatePlaying  = "playing"
	GameStateGameover = "gameover"
)

type Database struct {
	Gamestate GameState
	Players   map[uuid.UUID]Player
}

type Player struct {
	ID    uuid.UUID
	Alive bool
}
