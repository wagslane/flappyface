package main

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/wagslane/flappyface/internal/workflow"
	"go.temporal.io/sdk/client"
)

func main() {
	c, err := client.Dial(client.Options{})
	if err != nil {
		log.Fatalln("Unable to create Temporal client:", err)
	}

	options := client.StartWorkflowOptions{
		ID:        "flappyface-workflow-" + uuid.New().String(),
		TaskQueue: workflow.TaskQueueName,
	}

	we, err := c.ExecuteWorkflow(context.Background(), options, workflow.FlappyFaceWorkflow)
	if err != nil {
		log.Fatalln("Unable to start the Workflow:", err)
	}

	log.Printf("WorkflowID: %s RunID: %s\n", we.GetID(), we.GetRunID())
	var result string
	err = we.Get(context.Background(), &result)
	if err != nil {
		log.Fatalln("Unable to get Workflow result:", err)
	}
}
