import { createLevel } from "./level.js";
import { startFall, listenForJump, playerDie, createPlayer } from "./player.js";
import {
  registerOnConnected,
  registerOnCountdownCallback,
  registerOnPlayingCallback,
  registerOnGameoverCallback,
  registerOnPlayerDie,
  registerOnPlayerJump,
  die,
} from "../client.js";

import { playerJump } from "./player.js";

const players = {};

registerOnConnected((playerID, allPlayerIDs) => {
  console.log("Player connected:", playerID);
  console.log("All players:", allPlayerIDs);
  
  allPlayerIDs.forEach((id) => {
    if (!players[id]) {
      players[id] = createPlayer(id, id == playerID);
    }
  });
});

registerOnCountdownCallback((count) => {
  waitingtime.innerText = count;
});

registerOnPlayerJump((playerID) => {
  playerJump(players[playerID]);
});

registerOnPlayerDie((playerID) => {
  console.log("die:", playerID);
  playerDie(players[playerID]);
});

registerOnGameoverCallback(() => {
  console.log("game over:");
  gameOver();
});

let game = {
  score: 0,
  scoretimeout: null,
};

function startGame() {
  start.style.display = "none";

  createLevel();
  startScoring();
  for (const player of Object.values(players)) {
    startFall(player);
  }

  listenForJump();
  gameLoop();
}

export function resetGame() {
  player1.dead = false;
  player1.style.setProperty("--player-y", 0);

  level.style.animationPlayState = null;
  level.getAnimations().forEach((anim) => {
    anim.currentTime = 0;
  });

  clearInterval(game.scoretimeout);

  gameoverui.close();

  setTimeout(() => {
    startGame();
  }, 1500);
}

export function playGame() {
  startGame();
}

export function poolState() {
  console.log("poolState");
  // start.style.display = 'none'
  waiting.style.opacity = 1;
  playinstructions.style.display = "none";

  registerOnPlayingCallback(() => {
    startGame();
  });
}

function startScoring() {
  game.score = 0;

  game.scoretimeout = setInterval(() => {
    if (!player1.dead) {
      game.score += 10;
      score.textContent = game.score;
    }
  }, 100);
}

function collisionDetection() {
  const bird = player1.getBoundingClientRect();

  if (bird.bottom > window.innerHeight) return gameOver();

  if (bird.bottom < 0) return gameOver();

  // todo: dont go through every child
  for (let i = 0; i < level.children.length; i++) {
    const box = level.children[i].getBoundingClientRect();

    if (
      bird.left < box.right &&
      bird.right > box.left &&
      bird.top < box.bottom &&
      bird.bottom > box.top
    ) {
      startFall();
      player1.dead = true;
      playerDie();
      // return die()
      return gameOver();
    }
  }
}

function gameOver() {
  player1.dead = true;
  level.style.animationPlayState = "paused";
  gameoverui.showModal();

  resetbtn.addEventListener(
    "click",
    (event) => {
      resetGame();
    },
    { once: true },
  );
}

function gameLoop() {
  if (player1.dead) return;

  collisionDetection();
  requestAnimationFrame(gameLoop);
}
