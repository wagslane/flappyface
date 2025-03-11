import { getRandomNumber } from './utils.js'

export function createLevel() {
  let levels = document.createDocumentFragment()

  let width = 0
  let x = 0
  let flip = 0
  let gap = 800

  for (let i = 0; i < 50; i++) {
    let obstacle = document.createElement('div')

    x += gap
    width += gap + 200

    obstacle.style.left = x + 'px'

    const progress = i / (50 - 1);
    const height = 20 + (80 * progress);
    obstacle.style.height = height + '%'

    if (flip === 0) {
      flip = 1
      obstacle.style.top = '0'
    }
    else {
      flip = 0
      obstacle.style.bottom = '0'
    }

    levels.appendChild(obstacle)
  }

  level.style.width = width + 'px'
  level.style.animationDuration = width / 800 + 's'
  document.firstElementChild.style.setProperty('--game-level-end', '-' + width + 'px')
  level.append(levels)
}