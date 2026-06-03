import * as THREE from 'three'

/**
 * Soft vertical tissue sheet (plane in XY, extruded waves along Z).
 */
export function createWavyTissueGeometry(
  width: number,
  height: number,
  segmentsW = 12,
  segmentsH = 16,
  wavePhase = 0,
  pullStretch = 1,
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segmentsW, segmentsH)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const amp = 0.35 * pullStretch

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const u = (x / width + 0.5)
    const v = (y / height + 0.5)

    const wave =
      Math.sin(v * Math.PI * 3 + wavePhase) * 0.6 +
      Math.sin(u * Math.PI * 4 + wavePhase * 0.7) * 0.4

    pos.setZ(i, wave * amp * (0.3 + v * 0.7))
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/** Flat stack sheet (horizontal) */
export function createStackSheetGeometry(
  width: number,
  depth: number,
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, 6, 6)
  geo.rotateX(-Math.PI / 2)
  return geo
}
