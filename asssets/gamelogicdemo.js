import {
  jump,
  registerOnPlayerJump,
  registerOnStateChange,
  registerOnPlayerConnect,
  registerOnPlayerDie,
  registerOnConnected,
} from "./client.js";

registerOnConnected((playerId) => {
  console.log("Player connected:", playerId);
  jump(playerId);
});

registerOnPlayerDie((playerId) => {
  console.log("Player died:", playerId);
});

registerOnPlayerJump((playerId) => {
  console.log("Player jumped", playerId);
});
