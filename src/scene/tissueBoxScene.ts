import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  loadCardboardTexture,
  loadLabelTexture,
  loadTissueTexture,
} from '../helpers/textures'
import {
  createStackSheetGeometry,
  createWavyTissueGeometry,
} from '../helpers/tissueGeometry'
import { maxVisualStack } from '../game/inventory'
import type { ResultType } from '../game/types'

export interface TissueBoxSceneApi {
  domElement: HTMLCanvasElement
  playPullAnimation(onComplete: () => void): void
  setTissuesRemaining(globalRemaining: number): void
  setTissueTint(type: ResultType | null): void
  setInteractionEnabled(enabled: boolean): void
  resize(): void
  dispose(): void
}

export function createTissueBoxScene(): TissueBoxSceneApi {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1a1814')

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  )
  // Framed for UI margins — box sits in center of viewport
  camera.position.set(0, 8, 38)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5.5, 0)
  controls.maxPolarAngle = Math.PI * 0.52
  controls.minDistance = 22
  controls.maxDistance = 60

  const cardboardMap = loadCardboardTexture()
  const labelMap = loadLabelTexture()
  const tissueMap = loadTissueTexture()

  scene.add(new THREE.AmbientLight('#ffffff', 0.5))

  const keyLight = new THREE.DirectionalLight('#fff8ee', 1.15)
  keyLight.position.set(12, 24, 18)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 60
  keyLight.shadow.camera.left = -20
  keyLight.shadow.camera.right = 20
  keyLight.shadow.camera.top = 20
  keyLight.shadow.camera.bottom = -20
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight('#8ab4ff', 0.3)
  fillLight.position.set(-14, 8, -10)
  scene.add(fillLight)

  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: '#2a2620', roughness: 0.95 }),
  )
  table.rotation.x = -Math.PI / 2
  table.receiveShadow = true
  scene.add(table)

  const BOX = {
    width: 14,
    height: 9,
    depth: 20,
    wall: 0.45,
    slotWidth: 9,
    slotDepth: 5,
  }

  const boxMaterial = new THREE.MeshStandardMaterial({
    map: cardboardMap,
    roughness: 0.92,
    metalness: 0,
  })

  const boxGroup = new THREE.Group()

  function addBoxPart(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ): void {
    const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMaterial)
    part.position.set(x, y, z)
    part.castShadow = true
    part.receiveShadow = true
    boxGroup.add(part)
  }

  const { width, height, depth, wall, slotWidth, slotDepth } = BOX
  const halfW = width / 2
  const halfD = depth / 2
  const innerD = depth - wall * 2

  addBoxPart(width, wall, depth, 0, wall / 2, 0)
  addBoxPart(width, height, wall, 0, height / 2, halfD - wall / 2)
  addBoxPart(width, height, wall, 0, height / 2, -halfD + wall / 2)
  addBoxPart(wall, height, innerD, -halfW + wall / 2, height / 2, 0)
  addBoxPart(wall, height, innerD, halfW - wall / 2, height / 2, 0)

  const topY = height - wall / 2
  const stripX = (width - slotWidth) / 4
  const stripZ = (depth - slotDepth) / 4

  addBoxPart(width, wall, stripZ * 2, 0, topY, halfD - stripZ)
  addBoxPart(width, wall, stripZ * 2, 0, topY, -halfD + stripZ)
  addBoxPart(stripX * 2, wall, slotDepth, -halfW + stripX, topY, 0)
  addBoxPart(stripX * 2, wall, slotDepth, halfW - stripX, topY, 0)

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4.5),
    new THREE.MeshStandardMaterial({ map: labelMap, roughness: 0.75 }),
  )
  label.position.set(0, height * 0.55, halfD + 0.03)
  boxGroup.add(label)
  scene.add(boxGroup)

  function makeTissueMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: tissueMap,
      color: '#ffffff',
      roughness: 0.98,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    })
  }

  const stackMaterial = makeTissueMaterial()
  const stackGroup = new THREE.Group()
  stackGroup.position.y = wall + 0.15
  const sheetThickness = 0.14
  const sheetSize = { w: slotWidth - 0.6, d: slotDepth - 0.4 }
  let stackSheets: THREE.Mesh[] = []

  function rebuildStack(count: number): void {
    stackSheets.forEach((s) => {
      stackGroup.remove(s)
      s.geometry.dispose()
    })
    stackSheets = []
    for (let i = 0; i < count; i++) {
      const sheet = new THREE.Mesh(
        createStackSheetGeometry(sheetSize.w, sheetSize.d),
        stackMaterial,
      )
      sheet.position.y = i * sheetThickness
      sheet.castShadow = true
      sheet.receiveShadow = true
      stackGroup.add(sheet)
      stackSheets.push(sheet)
    }
  }

  rebuildStack(maxVisualStack())
  boxGroup.add(stackGroup)

  const PULL = {
    rest: 3.5,
    max: 22,
    baseLength: 5,
    width: sheetSize.w - 0.2,
  }

  let pullLength = PULL.rest
  let wavePhase = 0
  let pullableOpacity = 1
  type AnimMode = 'idle' | 'dispense'
  let animMode: AnimMode = 'idle'
  let dispenseTime = 0
  let onDispenseComplete: (() => void) | null = null

  const pullableGroup = new THREE.Group()
  boxGroup.add(pullableGroup)
  const slotCenterY = height
  const tissueMat = makeTissueMaterial()
  let tissueMesh: THREE.Mesh
  let tissueTipMesh: THREE.Mesh

  function buildPullableMeshes(): void {
    if (tissueMesh) {
      pullableGroup.remove(tissueMesh)
      tissueMesh.geometry.dispose()
    }
    if (tissueTipMesh) {
      pullableGroup.remove(tissueTipMesh)
      tissueTipMesh.geometry.dispose()
    }

    const totalH = PULL.baseLength + pullLength
    const stretch = 1 + pullLength / PULL.max

    tissueMesh = new THREE.Mesh(
      createWavyTissueGeometry(
        PULL.width,
        totalH,
        14,
        Math.max(16, Math.floor(16 + pullLength * 0.4)),
        wavePhase,
        stretch,
      ),
      tissueMat,
    )
    tissueMesh.position.y = totalH / 2
    tissueMesh.castShadow = true
    tissueMesh.receiveShadow = true
    pullableGroup.add(tissueMesh)

    tissueTipMesh = new THREE.Mesh(
      createWavyTissueGeometry(PULL.width * 0.92, 1.2, 8, 4, wavePhase + 0.5, 1.1),
      tissueMat,
    )
    tissueTipMesh.position.set(0, totalH + 0.35, 0.2)
    tissueTipMesh.rotation.x = -0.3
    pullableGroup.add(tissueTipMesh)
  }

  function updatePullable(rebuild = true): void {
    const totalH = PULL.baseLength + pullLength
    pullableGroup.position.set(0, slotCenterY - 0.2, 0)
    tissueMat.opacity = pullableOpacity
    if (rebuild) buildPullableMeshes()
    else if (tissueMesh && tissueTipMesh) {
      tissueMesh.position.y = totalH / 2
      tissueTipMesh.position.set(0, totalH + 0.35, 0.2)
    }
  }

  buildPullableMeshes()
  updatePullable(false)

  function consumeStackSheet(): void {
    if (stackSheets.length === 0) return
    const top = stackSheets.pop()!
    stackGroup.remove(top)
    top.geometry.dispose()
    stackSheets.forEach((s, i) => {
      s.position.y = i * sheetThickness
    })
  }

  const clock = new THREE.Clock()
  let raf = 0

  function tick(): void {
    const dt = Math.min(clock.getDelta(), 0.05)
    wavePhase += dt * 2.5

    if (animMode === 'dispense') {
      dispenseTime += dt
      if (dispenseTime < 0.35) {
        pullLength = THREE.MathUtils.lerp(
          pullLength,
          PULL.max,
          1 - Math.exp(-28 * dt),
        )
        updatePullable(true)
      } else if (dispenseTime < 0.9) {
        pullLength = THREE.MathUtils.lerp(
          pullLength,
          PULL.max + 6,
          1 - Math.exp(-35 * dt),
        )
        pullableOpacity = THREE.MathUtils.lerp(pullableOpacity, 0, 1 - Math.exp(-6 * dt))
        pullableGroup.position.y = slotCenterY - 0.2 + (dispenseTime - 0.35) * 8
        updatePullable(true)
      } else {
        consumeStackSheet()
        pullLength = PULL.rest
        pullableOpacity = 1
        pullableGroup.position.y = slotCenterY - 0.2
        animMode = 'idle'
        buildPullableMeshes()
        updatePullable(false)
        const cb = onDispenseComplete
        onDispenseComplete = null
        cb?.()
      }
    }

    if (animMode === 'idle' && tissueTipMesh) {
      tissueTipMesh.rotation.x = -0.3 + Math.sin(clock.elapsedTime * 2) * 0.04
      pullableGroup.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.02
    }

    controls.update()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }

  tick()

  return {
    domElement: renderer.domElement,

    playPullAnimation(onComplete: () => void) {
      if (animMode !== 'idle') return
      animMode = 'dispense'
      dispenseTime = 0
      onDispenseComplete = onComplete
    },

    setTissuesRemaining(globalRemaining: number) {
      const visual = Math.max(
        0,
        Math.min(maxVisualStack(), Math.ceil((globalRemaining / 250) * maxVisualStack())),
      )
      if (visual !== stackSheets.length) rebuildStack(visual)
    },

    setTissueTint(type: ResultType | null) {
      if (type === 'golden_tissue') {
        tissueMat.color.set('#ffd54a')
        tissueMat.emissive.set('#664400')
        tissueMat.emissiveIntensity = 0.15
      } else if (type === 'free_booger') {
        tissueMat.color.set('#b8f5c8')
        tissueMat.emissive.set('#000000')
        tissueMat.emissiveIntensity = 0
      } else {
        tissueMat.color.set('#ffffff')
        tissueMat.emissive.set('#000000')
        tissueMat.emissiveIntensity = 0
      }
      buildPullableMeshes()
    },

    setInteractionEnabled(enabled: boolean) {
      controls.enabled = enabled
    },

    resize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    },

    dispose() {
      cancelAnimationFrame(raf)
      controls.dispose()
      renderer.dispose()
    },
  }
}
