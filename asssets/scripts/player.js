const jumpAmount = 100

export function listenForJump() {
  document.addEventListener('click', function (event) {
    jump()
  })

  document.addEventListener('keydown', function (event) {
    if (event.key === ' ') jump()
  })
}

export function startFall() {
  fall()
}

function fall() {
  player1.style.transition = 'translate 1s ease-in'
  player1.style.setProperty('--player-y', '100dvh')
}

function stopFall() {
  const [, translateY] = window.getComputedStyle(player1).translate.split(' ')
  const curY = parseInt(translateY)
  player1.style.transition = null
  player1.style.setProperty('--player-y', curY + 'px')
}

export function jump() {
  if (player1.dead || player1.jumping) return

  player1.jumping = true

  const [, translateY] = window.getComputedStyle(player1).translate.split(' ')
  const curY = parseInt(translateY)

  player1.style.transition = 'translate .2s ease'
  player1.style.setProperty('--player-y', curY - jumpAmount + 'px')

  player1.addEventListener('transitionend', event => {
    player1.jumping = false
    fall()
  }, { once: true })
}