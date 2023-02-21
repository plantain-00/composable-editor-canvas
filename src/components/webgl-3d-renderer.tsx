import { m4, v3 } from 'twgl.js'
import * as twgl from 'twgl.js'
import { WeakmapCache } from '../utils'

export interface Camera {
  eye: [number, number, number]
  up: [number, number, number]
  target: [number, number, number]
  fov: number
  near: number
  far: number
}

export interface Light {
  position: [number, number, number]
  color: [number, number, number, number]
  specular: [number, number, number, number]
  shininess: number
  specularFactor: number
}

export interface BaseGraphic {
  color: [number, number, number, number]
  position?: [number, number, number]
}

export interface LinesGraphic extends BaseGraphic {
  type: 'lines'
  points: number[]
}

export interface SphereGraphic extends BaseGraphic {
  type: 'sphere'
  radius: number
}

export interface CubeGraphic extends BaseGraphic {
  type: 'cube'
  size: number
}

export interface CylinderGraphic extends BaseGraphic {
  type: 'cylinder'
  radius: number
  height: number
}

export interface CuneGraphic extends BaseGraphic {
  type: 'cune'
  bottomRadius: number
  topRadius: number
  height: number
}

export type Graphic3d = SphereGraphic | CubeGraphic | CylinderGraphic | CuneGraphic | LinesGraphic

export function createWebgl3DRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: true, stencil: true, premultipliedAlpha: false });
  if (!gl) {
    return
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const programInfo = twgl.createProgramInfo(gl, [`
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
  ])

  const tex = twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: [
      255, 255, 255, 255,
      192, 192, 192, 255,
      192, 192, 192, 255,
      255, 255, 255, 255,
    ],
  });
  const bufferInfoCache = new WeakmapCache<Graphic3d, twgl.BufferInfo>()

  return (graphics: Graphic3d[], { eye, up, fov, near, far, target }: Camera, light: Light, backgroundColor: [number, number, number, number]) => {
    twgl.resizeCanvasToDisplaySize(canvas);
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
    }

    const drawObjects: twgl.DrawObject[] = []
    for (const graphic of graphics) {
      let world = m4.identity()
      if (graphic.position) {
        world = m4.translate(world, graphic.position)
      }
      drawObjects.push({
        programInfo,
        bufferInfo: bufferInfoCache.get(graphic, () => {
          if (graphic.type === 'lines') {
            return twgl.createBufferInfoFromArrays(gl, {
              position: {
                numComponents: 3,
                data: graphic.points,
              }
            })
          }
          if (graphic.type === 'cube') {
            return twgl.primitives.createCubeBufferInfo(gl, graphic.size)
          }
          if (graphic.type === 'cylinder') {
            return twgl.primitives.createCylinderBufferInfo(gl, graphic.radius, graphic.height, 36, 4)
          }
          if (graphic.type === 'cune') {
            return twgl.primitives.createTruncatedConeBufferInfo(gl, graphic.bottomRadius, graphic.topRadius, graphic.height, 36, 4)
          }
          return twgl.primitives.createSphereBufferInfo(gl, graphic.radius, 72, 36)
        }),
        type: graphic.type === 'lines' ? gl.LINES : gl.TRIANGLES,
        uniforms: {
          ...uniforms,
          u_diffuseMult: graphic.color,
          u_world: world,
          u_worldInverseTranspose: m4.transpose(m4.inverse(world)),
          u_worldViewProjection: m4.multiply(viewProjection, world),
        },
      })
    }

    twgl.drawObjectList(gl, drawObjects)
  }
}

export function getDashedLine(p1: [number, number, number], p2: [number, number, number], dash: number) {
  const direction = v3.subtract(p2, p1)
  const totalLength = v3.length(direction)
  const normal = v3.normalize(direction)
  const result: [number, number, number][] = []
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
