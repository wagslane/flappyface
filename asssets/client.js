let socket = null;
let onJumpCallback = null;
let onStateChangeCallback = null;
let onPlayerConnectCallback = null;
let onPlayerDieCallback = null;
let onConnectedCallback = null;

// Initialize WebSocket connection
function initWebSocket() {
  // Create WebSocket connection
  const wsUrl = `ws://${window.location.host}/ws`;
  socket = new WebSocket(wsUrl);

  // Connection opened
  socket.addEventListener("open", () => {
    console.log("socket connected");
  });

  // Listen for messages
  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (e) {
      console.log("Received non-JSON message:", event.data);
    }
  });

  // Connection closed
  socket.addEventListener("close", () => {
    console.log("Disconnected from server");
    // Try to reconnect after a short delay
    setTimeout(initWebSocket, 3000);
  });

  // Connection error
  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

// Handle incoming messages
function handleMessage(message) {
  switch (message.type) {
    case "jump":
      if (onJumpCallback) {
        onJumpCallback(message.playerID);
      }
      break;
    case "connect":
      if (onConnectedCallback) {
        onConnectedCallback(message.playerID);
      }
      break;
    case "state":
      if (onStateChangeCallback) {
        onStateChangeCallback(message.state, message.countdown);
      }
      break;
    case "players":
      if (onPlayerConnectCallback) {
        onPlayerConnectCallback(message.players);
      }
      break;
    case "playerDie":
      if (onPlayerDieCallback) {
        onPlayerDieCallback(message.playerID);
      }
      break;
  }
}

// Send a message to the server
function sendMessage(msgType, data = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const message = {
      type: msgType,
      ...data,
    };
    const str = JSON.stringify(message);
    socket.send(str);
  } else {
    console.warn("WebSocket not connected, message not sent");
  }
}

// Initialize the connection when the module is loaded
initWebSocket();

// Public functions
export function jump(playerID) {
  sendMessage("jump", { playerID });
}

export function die(playerID) {
  sendMessage("die", { playerID });
}

export function registerOnPlayerJump(onJump) {
  onJumpCallback = onJump;
}

export function registerOnStateChange(onStateChange) {
  onStateChangeCallback = onStateChange;
}

export function registerOnPlayerConnect(onPlayerConnect) {
  onPlayerConnectCallback = onPlayerConnect;
}

export function registerOnPlayerDie(onPlayerDie) {
  onPlayerDieCallback = onPlayerDie;
}

export function registerOnConnected(onConnected) {
  onConnectedCallback = onConnected;
}
