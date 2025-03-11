package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/wagslane/flappyface/internal/database"
)

// Configure the upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client represents a connected websocket client
type Client struct {
	conn *websocket.Conn
	id   uuid.UUID
}

// ChatHub manages WebSocket connections
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.Mutex
	db         *database.Database
}

func (h *Hub) UpdateDB(db database.Database) {
	h.mutex.Lock()
	h.db = &db
	h.mutex.Unlock()
}

// NewHub creates a new ChatHub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		db: &database.Database{
			Players:   make(map[uuid.UUID]database.Player),
			Gamestate: database.GameStateInit,
		},
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client %s connected. Total clients: %d", client.id, len(h.clients))

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.conn.Close()
				log.Printf("Client %s disconnected. Total clients: %d", client.id, len(h.clients))
			}
			h.mutex.Unlock()

		case message := <-h.broadcast:
			h.mutex.Lock()
			for client := range h.clients {
				msgString := string(message)
				if strings.Contains(msgString, "jump") && strings.Contains(msgString, client.id.String()) {
					continue
				}
				if strings.Contains(msgString, "die") && strings.Contains(msgString, client.id.String()) {
					continue
				}
				err := client.conn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					log.Printf("Error broadcasting to client %s: %v", client.id, err)
					client.conn.Close()
					delete(h.clients, client)
				}
			}
			h.mutex.Unlock()
		}
	}
}

// WebSocket handler
func (h *Hub) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract client ID from URL variables
	playerID := uuid.New()

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket:", err)
		return
	}

	// Create a new client
	client := &Client{
		conn: conn,
		id:   playerID,
	}

	// Register the client
	h.register <- client

	h.onConnect(playerID)

	// Start reading messages from this client
	go h.handleMessages(client)
}

func (h *Hub) sendCountdown(count int) {
	countdownMessage := Message{
		Type:      "countdown",
		Countdown: count,
	}
	fmt.Println("sending countdown", count)
	countdownJSON, err := json.Marshal(countdownMessage)
	if err != nil {
		log.Printf("Error marshaling countdown message: %v", err)
		return
	}
	h.broadcast <- countdownJSON

}

func (h *Hub) onConnect(playerID uuid.UUID) {
	if len(h.db.Players) == 0 {
		go func() {
			for i := 29; i > 0; i-- {
				h.sendCountdown(i)
				time.Sleep(time.Second)
			}
			playingMsg := Message{
				Type: "playing",
			}
			fmt.Println("PLAYING")
			playingJSON, err := json.Marshal(playingMsg)
			if err != nil {
				log.Printf("Error marshaling playing message: %v", err)
				return
			}
			h.broadcast <- playingJSON
		}()
	}

	db, err := ActivityPlayerConnect(context.Background(), playerID, *h.db)
	if err != nil {
		log.Printf("Error connecting player %s: %v", playerID, err)
		return
	}
	h.UpdateDB(db)

	// Send a welcome message
	fmt.Printf("Welcome, %s!\n", playerID)
	connectMsg := Message{
		Type:     "connect",
		PlayerID: playerID,
	}

	connectJSON, err := json.Marshal(connectMsg)
	if err != nil {
		log.Printf("Error marshaling connect message: %v", err)
		return
	}

	log.Printf("Player %s connected", playerID)
	h.broadcast <- connectJSON
}

// Handle incoming WebSocket messages
func (h *Hub) handleMessages(client *Client) {
	defer func() {
		h.unregister <- client
	}()

	for {
		// Read message
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		// Format the message with the client ID
		formattedMsg := fmt.Sprintf("[%s]: %s", client.id, message)
		log.Printf("Received message: %s", formattedMsg)

		h.handleMessage(client, message)
	}
}

type Message struct {
	Type      string    `json:"type"`
	PlayerID  uuid.UUID `json:"playerID"`
	State     string    `json:"state,omitempty"`
	Players   []string  `json:"players,omitempty"`
	Countdown int       `json:"countdown,omitempty"`
}

func (h *Hub) handleMessage(client *Client, rawMessage []byte) error {
	var message Message
	if err := json.Unmarshal(rawMessage, &message); err != nil {
		return fmt.Errorf("Error unmarshaling message: %v", err)
	}

	// Process message based on type
	switch message.Type {
	case "jump":
		// Broadcast jump event to all clients
		jumpMsg := Message{
			Type:     "jump",
			PlayerID: client.id,
		}

		jsonJump, err := json.Marshal(jumpMsg)
		if err != nil {
			return fmt.Errorf("Error marshaling jump message: %v", err)
		}

		log.Printf("Player %s jumped", client.id)
		h.broadcast <- jsonJump
	case "die":
		// Broadcast player death to all clients
		dieMsg := Message{
			Type:     "die",
			PlayerID: client.id,
		}

		jsonDie, err := json.Marshal(dieMsg)
		if err != nil {
			return fmt.Errorf("Error unmarshalling: %v", err)
		}

		cpy, ok := h.db.Players[client.id]
		if ok {
			cpy.Alive = false
		}
		h.db.Players[client.id] = cpy

		log.Printf("Player %s died", client.id)
		h.broadcast <- jsonDie

		done := true
		for _, player := range h.db.Players {
			if player.Alive {
				done = false
			}
		}
		if done {
			h.db.Gamestate = database.GameStateGameover
			gameoverMsg := Message{
				Type: "gameover",
			}
			jsonDie, err = json.Marshal(gameoverMsg)
			if err != nil {
				return fmt.Errorf("Error unmarshalling: %v", err)
			}
			log.Printf("Game is over\n")
			h.broadcast <- jsonDie
			h.db.Players = map[uuid.UUID]database.Player{}
			h.db.Gamestate = database.GameStateInit
		}

	default:
		log.Printf("Unknown message type from client %s: %s", client.id, message.Type)
	}
	return nil
}

func startApi(h *Hub) {
	// Start the hub
	go h.Run()

	// Set up the router
	router := mux.NewRouter()

	// WebSocket endpoint
	router.HandleFunc("/ws", h.handleWebSocket)

	// Serve a simple HTML page for testing
	fs := http.FileServer(http.Dir("asssets"))
	router.PathPrefix("/").Handler(fs)

	// Start the server
	log.Println("Server starting on :1337")
	log.Fatal(http.ListenAndServe(":1337", router))
}
