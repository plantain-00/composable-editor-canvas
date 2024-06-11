import { m4, v3 } from 'twgl.js'
import * as twgl from 'twgl.js'
import earcut from 'earcut'
import * as verb from 'verb-nurbs-web'
import { colorNumberToRec, pixelColorToColorNumber } from '../utils/color'
import { WeakmapCache } from '../utils/weakmap-cache'
import { Nullable, Vec3, Vec4 } from '../utils/types'
import { Lazy } from '../utils/lazy'
import { maximumBy } from '../utils/math'

export interface Camera {
  eye: Vec3
  up: Vec3
  target: Vec3
  fov: number
  near: number
  far: number
}

export interface Light {
  position: Vec3
  color: Vec4
  specular: Vec4
  shininess: number
  specularFactor: number
}

export interface Material {
  color: Vec4
  position?: Vec3
  rotateY?: number
}

export interface LinesGeometry {
  type: 'lines' | 'line strip'
  points: number[]
}

export interface TrianglesGeometry {
  type: 'triangles' | 'triangle strip'
  points: number[]
}

export interface VerticesGeometry {
  type: 'vertices'
  vertices: Record<string, twgl.primitives.TypedArray>
  nurbs?: verb.geom.NurbsSurface
}

export interface PolygonGeometry {
  type: 'polygon'
  points: number[]
}

export interface SphereGeometry {
  type: 'sphere'
  radius: number
}

export interface CubeGeometry {
  type: 'cube'
  size: number
}

export interface CylinderGeometry {
  type: 'cylinder'
  radius: number
  height: number
}

export interface ConeGeometry {
  type: 'cone'
  bottomRadius: number
  topRadius: number
  height: number
}

export interface Graphic3d extends Material {
  geometry: SphereGeometry | CubeGeometry | CylinderGeometry | ConeGeometry | LinesGeometry | TrianglesGeometry | PolygonGeometry | VerticesGeometry
}

export function createWebgl3DRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: true, stencil: true, premultipliedAlpha: false });
  if (!gl) {
    return
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const primaryProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
  uniform mat4 u_worldViewProjection;
  uniform vec3 u_lightWorldPos;
  uniform mat4 u_world;
  uniform mat4 u_viewInverse;
  uniform mat4 u_worldInverseTranspose;

  attribute vec4 position;
  attribute vec3 normal;
  attribute vec2 texcoord;

  varying vec4 v_position;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  void main() {
    v_texCoord = texcoord;
    v_position = (u_worldViewProjection * position);
    v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
    v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
    v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
    gl_Position = v_position;
  }
  `, `
  precision mediump float;

  varying vec4 v_position;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  uniform vec4 u_lightColor;
  uniform vec4 u_diffuseMult;
  uniform sampler2D u_diffuse;
  uniform vec4 u_specular;
  uniform float u_shininess;
  uniform float u_specularFactor;

  vec4 lit(float l ,float h, float m) {
    return vec4(1.0,
                abs(l),//max(l, 0.0),
                (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                1.0);
  }

  void main() {
    vec4 diffuseColor = texture2D(u_diffuse, v_texCoord) * u_diffuseMult;
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLight = normalize(v_surfaceToLight);
    vec3 surfaceToView = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLight + surfaceToView);
    vec4 litR = lit(dot(normal, surfaceToLight),
                      dot(normal, halfVector), u_shininess);
    vec4 outColor = vec4((
    u_lightColor * (diffuseColor * litR.y +
                  u_specular * litR.z * u_specularFactor)).rgb,
        diffuseColor.a);
    gl_FragColor = outColor;
  }`,
  ]))
  const basicProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
  uniform mat4 u_worldViewProjection;
  attribute vec4 position;

  void main() {
    gl_Position = u_worldViewProjection * position;
  }
  `, `
  precision mediump float;
  uniform vec4 u_diffuseMult;

  void main() {
    gl_FragColor = u_diffuseMult;
  }`,
  ]))
  const pickingProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
  uniform mat4 u_worldViewProjection;

  attribute vec4 position;
  attribute vec2 texcoord;

  varying vec2 v_texCoord;

  void main() {
    v_texCoord = texcoord;
    gl_Position = u_worldViewProjection * position;
  }
  `, `
  precision mediump float;

  varying vec2 v_texCoord;

  uniform float u_threshhold;
  uniform vec4 u_pickColor;
  uniform vec4 u_diffuseMult;
  uniform sampler2D u_diffuse;

  void main() {
    vec4 diffuseColor = texture2D(u_diffuse, v_texCoord) * u_diffuseMult;
    if (diffuseColor.a <= u_threshhold) {
      discard;
    }
    gl_FragColor = u_pickColor;
  }
  `]))

  const tex = twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: [
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ],
  });
  const bufferInfoCache = new WeakmapCache<Graphic3d['geometry'], twgl.BufferInfo>()
  const pickingFBI = twgl.createFramebufferInfo(gl)
  let pickingDrawObjectsInfo: Nullable<PickingObjectInfo>[] = []

  const render = (graphics: (Nullable<Graphic3d>)[], { eye, up, fov, near, far, target }: Camera, light: Light, backgroundColor: Vec4) => {
    twgl.resizeCanvasToDisplaySize(canvas);
    twgl.bindFramebufferInfo(gl, null)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(...backgroundColor)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = m4.perspective(fov, canvas.clientWidth / canvas.clientHeight, near, far);
    const camera = m4.lookAt(eye, target, up);
    const viewProjection = m4.multiply(projection, m4.inverse(camera))
    const uniforms = {
      u_lightWorldPos: light.position,
      u_lightColor: light.color,
      u_specular: light.specular,
      u_shininess: light.shininess,
      u_specularFactor: light.specularFactor,
      u_diffuse: tex,
      u_viewInverse: camera,
      u_threshhold: 0.1,
    }

    const drawObjects: twgl.DrawObject[] = []
    pickingDrawObjectsInfo = []
    graphics.forEach((g, i) => {
      if (!g) {
        pickingDrawObjectsInfo.push(undefined)
        return
      }
      let world = m4.identity()
      if (g.rotateY) {
        world = m4.rotateY(world, g.rotateY)
      }
      if (g.position) {
        world = m4.translate(world, g.position)
      }
      let programInfo: twgl.ProgramInfo
      if (g.geometry.type === 'lines' || g.geometry.type === 'line strip' || g.geometry.type === 'triangles' || g.geometry.type === 'triangle strip' || g.geometry.type === 'polygon') {
        programInfo = basicProgramInfo.instance
      } else {
        programInfo = primaryProgramInfo.instance
      }
      const projection = m4.multiply(viewProjection, world)
      const drawObject: twgl.DrawObject = {
        programInfo,
        bufferInfo: bufferInfoCache.get(g.geometry, () => {
          if (g.geometry.type === 'sphere') {
            return twgl.primitives.createSphereBufferInfo(gl, g.geometry.radius, 72, 36)
          }
          if (g.geometry.type === 'cube') {
            return twgl.primitives.createCubeBufferInfo(gl, g.geometry.size)
          }
          if (g.geometry.type === 'cylinder') {
            return twgl.primitives.createCylinderBufferInfo(gl, g.geometry.radius, g.geometry.height, 36, 4)
          }
          if (g.geometry.type === 'cone') {
            return twgl.primitives.createTruncatedConeBufferInfo(gl, g.geometry.bottomRadius, g.geometry.topRadius, g.geometry.height, 36, 4)
          }
          if (g.geometry.type === 'polygon') {
            return twgl.createBufferInfoFromArrays(gl, {
              position: {
                numComponents: 3,
                data: get3dPolygonTriangles(g.geometry.points),
              }
            })
          }
          if (g.geometry.type === 'vertices') {
            return twgl.createBufferInfoFromArrays(gl, g.geometry.vertices)
          }
          return twgl.createBufferInfoFromArrays(gl, {
            position: {
              numComponents: 3,
              data: g.geometry.points,
            }
          })
        }),
        type: g.geometry.type === 'lines' ? gl.LINES : g.geometry.type === 'line strip' ? gl.LINE_STRIP : g.geometry.type === 'triangle strip' ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
        uniforms: {
          ...uniforms,
          u_diffuseMult: g.color,
          u_world: world,
          u_worldInverseTranspose: m4.transpose(m4.inverse(world)),
          u_worldViewProjection: projection,
          u_pickColor: colorNumberToRec(i),
        },
      }
      drawObjects.push(drawObject)
      pickingDrawObjectsInfo.push({
        graphic: g,
        index: i,
        drawObject: {
          ...drawObject,
          programInfo: pickingProgramInfo.instance,
        },
        reversedProjection: m4.inverse(projection),
      })
    })

    twgl.drawObjectList(gl, drawObjects)
  }

  const pick = (
    inputX: number,
    inputY: number,
    filter: (graphic: Graphic3d, index: number) => boolean = () => true,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const x = (inputX - rect.left) * gl.canvas.width / w | 0;
    const y = gl.canvas.height - ((inputY - rect.top) * gl.canvas.height / h | 0) - 1;

    twgl.resizeFramebufferInfo(gl, pickingFBI)
    twgl.bindFramebufferInfo(gl, pickingFBI)

    gl.clearColor(1, 1, 1, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    twgl.drawObjectList(gl, pickingDrawObjectsInfo.filter((p): p is PickingObjectInfo => !!p && filter(p.graphic, p.index)).map(p => p.drawObject))

    const pickColor = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pickColor);
    const index = pixelColorToColorNumber(pickColor)
    return index === 0xffffff ? undefined : index
  }

  const pickPoint = (inputX: number, inputY: number, eye: Vec3, z: number): Vec3 | undefined => {
    const rect = canvas.getBoundingClientRect();
    const x = (inputX - rect.left) / canvas.clientWidth * 2 - 1
    const y = -((inputY - rect.top) / canvas.clientHeight * 2 - 1)
    for (const info of pickingDrawObjectsInfo) {
      if (info && info.graphic.geometry.type === 'vertices' && info.graphic.geometry.nurbs) {
        const a = m4.transformPoint(info.reversedProjection, [x, y, 1])
        const b = (z - eye[2]) / (a[2] - eye[2])
        const target: Vec3 = [
          eye[0] + (a[0] - eye[0]) * b,
          eye[1] + (a[1] - eye[1]) * b,
          z,
        ]
        const line = new verb.geom.Line(eye, target)
        const intersections = verb.geom.Intersect.curveAndSurface(line, info.graphic.geometry.nurbs, 1e-3)
        if (intersections.length > 0) {
          const p = maximumBy(intersections, p => p.surfacePoint[2]).surfacePoint
          return [p[0], p[1], p[2]]
        }
      }
    }
    return
  }

  return {
    render,
    pick,
    pickPoint,
  }
}

interface PickingObjectInfo {
  graphic: Graphic3d
  index: number
  drawObject: twgl.DrawObject
  reversedProjection: m4.Mat4
}

export function get3dPolygonTriangles(vertices: number[]) {
  const index = earcut(vertices, undefined, 3)
  const triangles: number[] = []
  for (let i = 0; i < index.length; i += 3) {
    triangles.push(
      vertices[index[i] * 3], vertices[index[i] * 3 + 1], vertices[index[i] * 3 + 2],
      vertices[index[i + 1] * 3], vertices[index[i + 1] * 3 + 1], vertices[index[i + 1] * 3 + 2],
      vertices[index[i + 2] * 3], vertices[index[i + 2] * 3 + 1], vertices[index[i + 2] * 3 + 2]
    )
  }
  return triangles
}

export function getDashedLine(p1: Vec3, p2: Vec3, dash: number) {
  const direction = v3.subtract(p2, p1)
  const totalLength = v3.length(direction)
  const normal = v3.normalize(direction)
  const result: Vec3[] = []
  let start = p1
  let length = dash
  for (; ;) {
    length += dash
    if (length > totalLength) {
      result.push(start, p2)
      break
    }
    const end = v3.add(p1, v3.mulScalar(normal, length))
    result.push(start, [end[0], end[1], end[2]])
    length += dash
    if (length >= totalLength) {
      break
    }
    const next = v3.add(p1, v3.mulScalar(normal, length))
    start = [next[0], next[1], next[2]]
  }
  return result
}

export const getAxesGraphics = (length = 100): Graphic3d[] => [
  {
    geometry: {
      type: 'lines',
      points: [0, 0, 0, length, 0, 0],
    },
    color: [1, 0, 0, 1],
  },
  {
    geometry: {
      type: 'lines',
      points: [0, 0, 0, 0, length, 0],
    },
    color: [0, 1, 0, 1],
  },
  {
    geometry: {
      type: 'lines',
      points: [0, 0, 0, 0, 0, length],
    },
    color: [0, 0, 1, 1],
  },
]
