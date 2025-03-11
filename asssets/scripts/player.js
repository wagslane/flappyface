const jumpAmount = 100

export function listenForJump() {
  document.addEventListener('click', function (event) {
    jump()
  })

  document.addEventListener('keydown', function (event) {
    if (event.key === ' ') jump()
  })
}

export function startFall(player) {
  // todo iterate and apply
  const sprite = player || player1
  fall(sprite)
}

function fall(sprite) {
  sprite.style.transition = 'translate 1s ease-in'
  sprite.style.setProperty('--player-y', '100dvh')
}

export function jump(player) {
  const sprite = player || player1

  if (sprite.dead || sprite.jumping) return

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