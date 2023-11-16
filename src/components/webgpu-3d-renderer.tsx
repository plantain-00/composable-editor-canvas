import { m4 } from 'twgl.js'
import * as twgl from 'twgl.js'
import { MapCache, WeakmapCache } from '../utils/weakmap-cache'
import { Nullable, OptionalField, Vec4 } from '../utils/types'
import { Camera, Graphic3d, Light, get3dPolygonTriangles } from './webgl-3d-renderer'
import { Lazy } from '../utils/lazy'
import { createUniformsBuffer } from './react-render-target'
import { colorNumberToRec, pixelColorToColorNumber } from '../utils/color'

export async function createWebgpu3DRenderer(canvas: HTMLCanvasElement) {
  if (!navigator.gpu) return
  const context = canvas.getContext("webgpu")
  if (!context) return
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return
  const device = await adapter.requestDevice()
  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format,
  })
  const blend: GPUBlendState = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
  }

  const primaryShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      worldViewProjection: mat4x4f,
      lightWorldPos: vec3f,
      world: mat4x4f,
      viewInverse: mat4x4f,
      worldInverseTranspose: mat4x4f,
      lightColor: vec4f,
      diffuseMult: vec4f,
      shininess: f32,
      specular: vec4f,
      specularFactor: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var mySampler: sampler;
    @group(0) @binding(2) var myTexture: texture_2d<f32>;

    struct VertexInput {
      @location(0) position: vec4f,
      @location(1) normal: vec3f,
      @location(2) texcoord: vec2f,
    };

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) texcoord: vec2f,
      @location(1) normal: vec3f,
      @location(2) surfaceToLight: vec3f,
      @location(3) surfaceToView: vec3f,
    };

    fn lit(l: f32, h: f32, m: f32) -> vec4f {
      var a: f32 = 0.0;
      if l > 0.0 {
        a = pow(max(0.0, h), m);
      }
      return vec4f(1.0, abs(l), a, 1.0);
    }
  
    @vertex
    fn vertex_main(v: VertexInput) -> VertexOutput {
      var vsOut: VertexOutput;
      vsOut.position = uniforms.worldViewProjection * v.position;
      vsOut.texcoord = v.texcoord;
      vsOut.normal = (uniforms.worldInverseTranspose * vec4f(v.normal, 0.0)).xyz;
      vsOut.surfaceToLight = uniforms.lightWorldPos - (uniforms.world * v.position).xyz;
      vsOut.surfaceToView = (uniforms.viewInverse[3] - (uniforms.world * v.position)).xyz;
      return vsOut;
    }

    @fragment
    fn fragment_main(v: VertexOutput) -> @location(0) vec4f {
      var diffuseColor = textureSample(myTexture, mySampler, v.texcoord) * uniforms.diffuseMult;
      var normal = normalize(v.normal);
      var surfaceToLight = normalize(v.surfaceToLight);
      var surfaceToView = normalize(v.surfaceToView);
      var halfVector = normalize(surfaceToLight + surfaceToView);
      var litR = lit(dot(normal, surfaceToLight), dot(normal, halfVector), uniforms.shininess);
      return vec4((uniforms.lightColor * (diffuseColor * litR.y + uniforms.specular * litR.z * uniforms.specularFactor)).rgb, diffuseColor.a);
    }`
  }))
  const basicShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      worldViewProjection: mat4x4f,
      lightWorldPos: vec3f,
      world: mat4x4f,
      viewInverse: mat4x4f,
      worldInverseTranspose: mat4x4f,
      lightColor: vec4f,
      diffuseMult: vec4f,
      shininess: f32,
      specular: vec4f,
      specularFactor: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn vertex_main(@location(0) position: vec4f) -> @builtin(position) vec4f
    {
      return uniforms.worldViewProjection * position;
    }

    @fragment
    fn fragment_main() -> @location(0) vec4f
    {
      return uniforms.diffuseMult;
    }`
  }))
  const pickingShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      worldViewProjection: mat4x4f,
      lightWorldPos: vec3f,
      world: mat4x4f,
      viewInverse: mat4x4f,
      worldInverseTranspose: mat4x4f,
      lightColor: vec4f,
      diffuseMult: vec4f,
      shininess: f32,
      specular: vec4f,
      specularFactor: f32,
      pickColor: vec4f,
      threshhold: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var mySampler: sampler;
    @group(0) @binding(2) var myTexture: texture_2d<f32>;

    struct VertexInput {
      @location(0) position: vec4f,
      @location(1) texcoord: vec2f,
    };

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) texcoord: vec2f,
    };

    @vertex
    fn vertex_main(v: VertexInput) -> VertexOutput {
      var vsOut: VertexOutput;
      vsOut.position = uniforms.worldViewProjection * v.position;
      vsOut.texcoord = v.texcoord;
      return vsOut;
    }

    @fragment
    fn fragment_main(v: VertexOutput) -> @location(0) vec4f {
      var diffuseColor = textureSample(myTexture, mySampler, v.texcoord) * uniforms.diffuseMult;
      if (diffuseColor.a <= uniforms.threshhold) {
        discard;
      }
      return uniforms.pickColor;
    }`
  }))

  const sampler = device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest',
  });
  const sampleCount = 4
  const sampleTexture = new Lazy(() => device.createTexture({
    size: [canvas.width, canvas.height],
    sampleCount,
    format,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  }), t => t.destroy())
  const depthTexture = new Lazy(() => device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    sampleCount,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  }), t => t.destroy())
  const texture = device.createTexture({
    size: [2, 2],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture },
    new Uint8Array([
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ]),
    { bytesPerRow: 8, rowsPerImage: 2 },
    { width: 2, height: 2 },
  );
  const pickingTexture = new Lazy(() => device.createTexture({
    size: [canvas.width, canvas.height],
    format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC |
      GPUTextureUsage.RENDER_ATTACHMENT,
  }), t => t.destroy())

  const basicPipelineCache = new MapCache<Graphic3d['geometry']['type'], GPURenderPipeline>()
  const pickingPipelineCache = new MapCache<Graphic3d['geometry']['type'], GPURenderPipeline>()
  const bufferCache = new WeakmapCache<Graphic3d['geometry'], OptionalField<ReturnType<typeof createBuffers>, 'primaryBuffers'>>()
  let pickingDrawObjectsInfo: Nullable<PickingObjectInfo>[] = []

  const render = (graphics: (Nullable<Graphic3d>)[], { eye, up, fov, near, far, target }: Camera, light: Light, backgroundColor: Vec4) => {
    if (canvas.width !== sampleTexture.instance.width || canvas.height !== sampleTexture.instance.height) {
      sampleTexture.reset()
      depthTexture.reset()
      pickingTexture.reset()
    }

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        clearValue: backgroundColor,
        loadOp: 'clear',
        storeOp: 'store',
        view: sampleTexture.instance.createView(),
        resolveTarget: context.getCurrentTexture().createView()
      }],
      depthStencilAttachment: {
        view: depthTexture.instance.createView(),
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    const projection = m4.perspective(fov, canvas.clientWidth / canvas.clientHeight, near, far);
    const camera = m4.lookAt(eye, target, up);
    const viewProjection = m4.multiply(projection, m4.inverse(camera))
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
      const pipeline = basicPipelineCache.get(g.geometry.type, () => {
        let shaderModule: GPUShaderModule
        const bufferLayouts: GPUVertexBufferLayout[] = [{ arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }]
        if (g.geometry.type === 'lines' || g.geometry.type === 'line strip' || g.geometry.type === 'triangles' || g.geometry.type === 'triangle strip' || g.geometry.type === 'polygon') {
          shaderModule = basicShaderModule.instance
        } else {
          shaderModule = primaryShaderModule.instance
          bufferLayouts.push(
            { arrayStride: 3 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }] },
            { arrayStride: 2 * 4, attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }] },
          )
        }
        return device.createRenderPipeline({
          vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: bufferLayouts,
          },
          fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{ format, blend }]
          },
          primitive: {
            cullMode: 'back',
            topology: g.geometry.type === 'lines' ? 'line-list' : g.geometry.type === 'line strip' ? 'line-strip' : g.geometry.type === 'triangle strip' ? 'triangle-strip' : 'triangle-list',
          },
          depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
          },
          multisample: {
            count: sampleCount,
          },
          layout: 'auto',
        })
      })
      passEncoder.setPipeline(pipeline);
      const bindGroupEntries: GPUBindGroupEntry[] = [{
        binding: 0, resource: {
          buffer: createUniformsBuffer(device, [
            { type: 'mat4x4', value: m4.multiply(viewProjection, world) },
            { type: 'vec3', value: light.position },
            { type: 'mat4x4', value: world },
            { type: 'mat4x4', value: camera },
            { type: 'mat4x4', value: m4.transpose(m4.inverse(world)) },
            { type: 'vec4', value: light.color },
            { type: 'vec4', value: g.color },
            { type: 'number', value: light.shininess },
            { type: 'vec4', value: light.specular },
            { type: 'number', value: light.specularFactor },
            { type: 'vec4', value: colorNumberToRec(i) },
            { type: 'number', value: 0.1 },
          ])
        },
      }]
      if (g.geometry.type !== 'lines' && g.geometry.type !== 'line strip' && g.geometry.type !== 'triangles' && g.geometry.type !== 'triangle strip' && g.geometry.type !== 'polygon') {
        bindGroupEntries.push(
          { binding: 1, resource: sampler },
          { binding: 2, resource: texture.createView() },
        )
      }
      passEncoder.setBindGroup(0, device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: bindGroupEntries,
      }));
      const { positionBuffer, primaryBuffers, count } = bufferCache.get(g.geometry, () => {
        if (g.geometry.type === 'sphere') {
          return createBuffers(device, twgl.primitives.createSphereVertices(g.geometry.radius, 72, 36))
        }
        if (g.geometry.type === 'cube') {
          return createBuffers(device, twgl.primitives.createCubeVertices(g.geometry.size))
        }
        if (g.geometry.type === 'cylinder') {
          return createBuffers(device, twgl.primitives.createCylinderVertices(g.geometry.radius, g.geometry.height, 36, 4))
        }
        if (g.geometry.type === 'cone') {
          return createBuffers(device, twgl.primitives.createTruncatedConeVertices(g.geometry.bottomRadius, g.geometry.topRadius, g.geometry.height, 36, 4))
        }
        if (g.geometry.type === 'polygon') {
          return {
            positionBuffer: createVertexBuffer(device, new Float32Array(get3dPolygonTriangles(g.geometry.points))),
            count: g.geometry.points.length / 3,
          }
        }
        if (g.geometry.type === 'vertices') {
          return createBuffers(device, g.geometry.vertices)
        }
        return {
          positionBuffer: createVertexBuffer(device, new Float32Array(g.geometry.points)),
          count: g.geometry.points.length / 3,
        }
      })
      passEncoder.setVertexBuffer(0, positionBuffer);
      if (primaryBuffers) {
        passEncoder.setVertexBuffer(1, primaryBuffers.normalBuffer);
        passEncoder.setVertexBuffer(2, primaryBuffers.texcoordBuffer);
        passEncoder.setIndexBuffer(primaryBuffers.indicesBuffer, 'uint16');
        passEncoder.drawIndexed(count)
      } else {
        passEncoder.draw(count)
      }
      pickingDrawObjectsInfo.push({
        graphic: g,
        index: i,
        bindGroupEntries,
        positionBuffer,
        primaryBuffers,
        count,
      })
    })

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  const pick = async (
    inputX: number,
    inputY: number,
    filter: (graphic: Graphic3d, index: number) => boolean = () => true,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const x = (inputX - rect.left) * canvas.width / w | 0;
    const y = (inputY - rect.top) * canvas.height / h | 0;

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        clearValue: [1, 1, 1, 1],
        loadOp: 'clear',
        storeOp: 'store',
        view: sampleTexture.instance.createView(),
        resolveTarget: pickingTexture.instance.createView()
      }],
      depthStencilAttachment: {
        view: depthTexture.instance.createView(),
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });
    for (const p of pickingDrawObjectsInfo) {
      if (p && filter(p.graphic, p.index)) {
        const g = p.graphic
        const pipeline = pickingPipelineCache.get(g.geometry.type, () => {
          const shaderModule = pickingShaderModule.instance
          const bufferLayouts: GPUVertexBufferLayout[] = [
            { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
            { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }] },
          ]
          return device.createRenderPipeline({
            vertex: {
              module: shaderModule,
              entryPoint: 'vertex_main',
              buffers: bufferLayouts,
            },
            fragment: {
              module: shaderModule,
              entryPoint: 'fragment_main',
              targets: [{ format, blend }]
            },
            primitive: {
              cullMode: 'back',
              topology: g.geometry.type === 'lines' ? 'line-list' : g.geometry.type === 'line strip' ? 'line-strip' : g.geometry.type === 'triangle strip' ? 'triangle-strip' : 'triangle-list',
            },
            depthStencil: {
              depthWriteEnabled: true,
              depthCompare: 'less',
              format: 'depth24plus',
            },
            multisample: {
              count: sampleCount,
            },
            layout: 'auto',
          })
        })
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: p.bindGroupEntries,
        }));
        passEncoder.setVertexBuffer(0, p.positionBuffer);
        if (p.primaryBuffers) {
          passEncoder.setVertexBuffer(1, p.primaryBuffers.texcoordBuffer);
          passEncoder.setIndexBuffer(p.primaryBuffers.indicesBuffer, 'uint16');
          passEncoder.drawIndexed(p.count)
        } else {
          passEncoder.draw(p.count)
        }
      }
    }
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    const commandEncoder2 = device.createCommandEncoder();
    const pickColor = device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
    commandEncoder2.copyTextureToBuffer(
      { texture: pickingTexture.instance, origin: { x, y } },
      { buffer: pickColor },
      { width: 1, height: 1 },
    )
    device.queue.submit([commandEncoder2.finish()]);
    await pickColor.mapAsync(1, 0, 4)
    const buffer = new Uint8Array(pickColor.getMappedRange(0, 4))
    const index = pixelColorToColorNumber([buffer[2], buffer[1], buffer[0]])
    return index === 0xffffff ? undefined : index
  }

  return {
    render,
    pick,
  }
}

interface PickingObjectInfo {
  graphic: Graphic3d
  index: number
  bindGroupEntries: GPUBindGroupEntry[]
  positionBuffer: GPUBuffer
  count: number
  primaryBuffers?: {
    normalBuffer: GPUBuffer;
    texcoordBuffer: GPUBuffer;
    indicesBuffer: GPUBuffer;
  }
}

function createVertexBuffer(device: GPUDevice, data: twgl.primitives.TypedArray) {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  const dst = new Float32Array(buffer.getMappedRange());
  dst.set(data);
  buffer.unmap();
  return buffer;
}

function createIndexBuffer(device: GPUDevice, data: twgl.primitives.TypedArray) {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  const dst = new Uint16Array(buffer.getMappedRange());
  dst.set(data);
  buffer.unmap();
  return buffer;
}

function createBuffers(device: GPUDevice, buffers: Record<string, twgl.primitives.TypedArray>) {
  const { position, normal, texcoord, indices } = buffers
  const positionBuffer = createVertexBuffer(device, position);
  const normalBuffer = createVertexBuffer(device, normal);
  const texcoordBuffer = createVertexBuffer(device, texcoord);
  const indicesBuffer = createIndexBuffer(device, indices);
  return {
    positionBuffer,
    primaryBuffers: { normalBuffer, texcoordBuffer, indicesBuffer },
    count: indices.length,
  }
}
