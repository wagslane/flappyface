package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

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

	db, err := ActivityPlayerConnect(context.Background(), client.id, *h.db)
	if err != nil {
		log.Printf("Error connecting player %s: %v", client.id, err)
		return
	}
	h.UpdateDB(db)

	// Send a welcome message
	fmt.Printf("Welcome, %s!\n", playerID)
	connectMsg := Message{
		Type:     "connect",
		PlayerID: client.id,
	}

	connectJSON, err := json.Marshal(connectMsg)
	if err != nil {
		log.Printf("Error marshaling connect message: %v", err)
		return
	}

	log.Printf("Player %s connected", client.id)
	h.broadcast <- connectJSON

	// Start reading messages from this client
	go h.handleMessages(client)
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

		log.Printf("Player %s died", client.id)
		h.broadcast <- jsonDie

		// Check if game should end
		// h.checkGameEnd()

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
