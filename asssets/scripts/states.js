import { createLevel } from './level.js'
import { startFall, listenForJump } from './player.js'
import { registerOnConnected } from '../client.js'
import { jump } from './player.js'

let game = {
  score: 0,
  scoretimeout: null,
}

// function randomJump() {
//   setTimeout(() => {
//     jump(player2)
//     randomJump()
//   }, Math.random() * 500 + 150)
// }

function startGame() {
  start.style.display = 'none'
  
  createLevel()
  startScoring()
  startFall(player1)
  // startFall(player2)
  // randomJump()
  listenForJump()
  gameLoop()
}

export function resetGame() {
  player1.dead = false
  player1.style.setProperty('--player-y', 0)

  level.style.animationPlayState = null
  level.getAnimations().forEach((anim) => {
    anim.currentTime = 0
  })

  clearInterval(game.scoretimeout)

  gameoverui.close()

  setTimeout(() => {
    startGame()
  }, 1500)
}

export function playGame() {
  startGame()
}

export function poolState() {
  registerOnConnected((playerID) => {
    console.log('Player connected:', playerID)
  })
  console.log('poolState')
  // start.style.display = 'none'
  waiting.style.opacity = 1
  playinstructions.style.display = 'none'

  // listen for game to start
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      startGame()
    }
  })
}

function startScoring() {
  game.score = 0

  game.scoretimeout = setInterval(() => {
    if (!player1.dead) {
      game.score += 10
      score.textContent = game.score
    }
  }, 100)
}

function collisionDetection() {
  const bird = player1.getBoundingClientRect()

  if (bird.bottom > window.innerHeight)
    return gameOver()

  if (bird.bottom < 0)
    return gameOver()

  // todo: dont go through every child
  for (let i = 0; i < level.children.length; i++) {
    const box = level.children[i].getBoundingClientRect();

    if (
      bird.left < box.right &&
      bird.right > box.left &&
      bird.top < box.bottom &&
      bird.bottom > box.top
    ) {
      startFall()
      return gameOver()
    }
  }
}

function gameOver() {
  player1.dead = true
  level.style.animationPlayState = 'paused'
  gameoverui.showModal()

  resetbtn.addEventListener('click', event => {
    resetGame()
  }, { once: true })
}

function gameLoop() {
  if (player1.dead) return

  collisionDetection()
  requestAnimationFrame(gameLoop)
}

