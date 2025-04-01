import { jump } from "../client.js";

const jumpAmount = 100

export function listenForJump() {
  document.addEventListener('click', function (event) {
    playerJump()
  })

  document.addEventListener('keydown', function (event) {
    if (event.key === ' ') playerJump()
  })
}

export function startFall(player) {
  const sprite = player || player1
  fall(sprite)
}

function fall(sprite) {
  sprite.style.transition = 'translate 1s ease-in'
  sprite.style.setProperty('--player-y', '100dvh')
}

export function playerDie(player) {
  const sprite = player || player1
  sprite.dead = true
}

export function playerJump(player) {
  const sprite = player || player1

  if (sprite.dead) return

  if (!player) jump()
  sprite.jumping = true

  const [, translateY] = window.getComputedStyle(sprite).translate.split(' ')
  const curY = parseInt(translateY)

  sprite.style.transition = 'translate .2s ease'
  sprite.style.setProperty('--player-y', curY - jumpAmount + 'px')

  sprite.addEventListener('transitionend', event => {
    sprite.jumping = false
    fall(sprite)
  }, { once: true })
}

export function createPlayer(playerID, isLocal) {
  const player = document.createElement('div');
  player.id = isLocal ? 'player1' : playerID;
  player.className = 'player';
  player.setAttribute('local-player', isLocal)

  const birdDiv = document.createElement('div');
  birdDiv.className = 'bird';

  const leftWingDiv = document.createElement('div');
  leftWingDiv.className = 'left-wing';

  const rightWingDiv = document.createElement('div');
  rightWingDiv.className = 'right-wing';

  birdDiv.appendChild(leftWingDiv);
  birdDiv.appendChild(rightWingDiv);

  player.appendChild(birdDiv);

  document.body.appendChild(player);

  return player;
}