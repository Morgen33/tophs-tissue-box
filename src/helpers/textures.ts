import * as THREE from 'three'

/** Procedural cardboard — loaded via TextureLoader from a canvas data URL */
export function loadCardboardTexture(): THREE.Texture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#c9a66b'
  ctx.fillRect(0, 0, size, size)

  // Fiber grain
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const a = 0.04 + Math.random() * 0.06
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(90,60,30,${a})` : `rgba(255,230,180,${a})`
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1)
  }

  // Horizontal corrugation bands
  for (let y = 0; y < size; y += 6) {
    ctx.fillStyle = `rgba(0,0,0,${0.02 + (y % 12 === 0 ? 0.03 : 0)})`
    ctx.fillRect(0, y, size, 2)
  }

  const loader = new THREE.TextureLoader()
  const texture = loader.load(canvas.toDataURL('image/png'))
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  texture.anisotropy = 4
  return texture
}

/** Kleenex-style front label */
export function loadLabelTexture(): THREE.Texture {
  const w = 512
  const h = 320
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#5eb8e8')
  grad.addColorStop(1, '#3d8fd4')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Soft oval logo area
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.38, 90, 55, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText("TOPH'S", w / 2, h * 0.38)

  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText('BOOGERS', w / 2, h * 0.52)

  ctx.font = '18px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText('250 TISSUES', w / 2, h * 0.68)

  ctx.font = '14px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText('one pull per finger', w / 2, h * 0.78)

  const loader = new THREE.TextureLoader()
  const texture = loader.load(canvas.toDataURL('image/png'))
  texture.anisotropy = 4
  return texture
}

/** Soft tissue sheet pattern */
export function loadTissueTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = `rgba(200,200,210,${0.02 + Math.random() * 0.04})`
    ctx.fillRect(x, y, 2, 1)
  }

  // Subtle embossed lines
  ctx.strokeStyle = 'rgba(180,180,190,0.15)'
  ctx.lineWidth = 1
  for (let y = 20; y < size; y += 18) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y + 4)
    ctx.stroke()
  }

  const loader = new THREE.TextureLoader()
  const texture = loader.load(canvas.toDataURL('image/png'))
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.5, 2)
  texture.anisotropy = 4
  return texture
}
