package workflow

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/wagslane/flappyface/internal/database"
)

func ActivityPlayerConnect(ctx context.Context, playerID uuid.UUID, db database.Database) (database.Database, error) {
	player := database.Player{
		ID:    playerID,
		Alive: true,
	}
	log.Printf("Connected player: %v.\n\n",
		playerID,
	)
	db.Players[playerID] = player
	return db, nil
}
