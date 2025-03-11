export function jump(id) {}

// onPlayerJump(playerId)
export function registerOnPlayerJump(onJump) {
  // call onJump whenever an event is received
}

// onStateChange(stateEnum, countdownNumber?)
// - init (waiting for first connection)
// - countdown (first player connected, countdown start)
// - playing
// - gameover
export function registerOnStateChange(onStateChange) {}

// onPlayerConnect(playerIdList)
export function registerOnPlayerConnect(onPlayerConnect) {}

// onPlayerDie(playerId)
export function registerOnPlayerDie(onPlayerDie) {}
