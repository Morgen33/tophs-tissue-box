import './style.css'
import './styles/game.css'
import { getInventory } from './game/storage'
import { createTissueBoxScene } from './scene/tissueBoxScene'
import { createGameOverlay } from './ui/gameOverlay'

const scene = createTissueBoxScene()
document.body.appendChild(scene.domElement)

const overlay = createGameOverlay({
  onPullStart(pull) {
    scene.setTissueTint(pull.result_type)
    scene.setTissuesRemaining(getInventory().tissuesLeft)

    scene.playPullAnimation(() => {
      overlay.finishPull(pull)
    })
  },
})

document.body.appendChild(overlay.root)
scene.setTissuesRemaining(getInventory().tissuesLeft)

window.addEventListener('resize', () => scene.resize())

// Expose for dev console: window.__TOPHS_GAME__.reset()
;(window as unknown as { __TOPHS_GAME__?: { reset: () => void } }).__TOPHS_GAME__ =
  {
    reset: async () => {
      const { resetGameStore } = await import('./game/storage')
      resetGameStore()
      location.reload()
    },
  }
