export function jump(id) {}

// onPlayerJump(playerId)
export function registerOnPlayerJump(onJump) {
  // call onJump whenever an event is received
}

// onStateChange(stateEnum)
// - init (waiting for first connection)
// - countdown29 (first player connected, countdown start)
// - countdown28 (one second after...)
// ...
// - countdown0
// - playing
// - gameover
export function registerOnStateChange(onStateChange) {}

// onPlayerConnect(playerIdList)
export function registerOnPlayerConnect(onPlayerConnect) {}

// onPlayerDie(playerId)
export function registerOnPlayerDie(onPlayerDie) {}
