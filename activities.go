package main // @@@SNIPSTART money-transfer-project-template-go-activity-withdraw
import (
	"context"
	"log"
)

type Player struct {
	ID string
}

func activityPlayerConnect(ctx context.Context, player Player) (string, error) {
	log.Printf("Connected player: %v.\n\n",
		player.ID,
	)

	confirmation, err := bank.Withdraw(data.SourceAccount, data.Amount, referenceID)
	return confirmation, err
}
