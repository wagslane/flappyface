let socket = null;
let onJumpCallback = null;
let onCountdownCallback = null;
let onPlayerDieCallback = null;
let onConnectedCallback = null;
let onPlayingCallback = null;

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
  console.log("MESSAGE:", message);
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
    case "die":
      if (onPlayerDieCallback) {
        onPlayerDieCallback(message.playerID);
      }
      break;
    case "gameover":
      if (onGameoverCallback) {
        onGameoverCallback();
      }
      break;
    case "countdown":
      if (onCountdownCallback) {
        onCountdownCallback(message.countdown);
      }
      break;
    case "playing":
      if (onPlayingCallback) {
        onPlayingCallback();
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

export function registerOnPlayerDie(onPlayerDie) {
  onPlayerDieCallback = onPlayerDie;
}

export function registerOnConnected(onConnected) {
  onConnectedCallback = onConnected;
}

export function registerOnCountdownCallback(onCountdown) {
  onCountdownCallback = onCountdown;
}

export function onGameoverCallback(onGameover) {
  onGameoverCallback = onGameover;
}

export function registerOnPlayingCallback(onPlaying) {
  onPlayingCallback = onPlaying;
}
