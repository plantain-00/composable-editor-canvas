/// <reference types="@webgpu/types" />
import { Lazy } from "../../utils/lazy";
import { mergeOpacityToColor } from "../../utils/color";
import { Matrix, m3 } from "../../utils/matrix";
import { MemoryLayoutInput, createMemoryLayoutArray } from "../../utils/memory-layout";
import { Vec4 } from "../../utils/types";
import { MapCache, WeakmapCache } from "../../utils/weakmap-cache";
import { Graphic, LineOrTriangleGraphic, defaultVec4Color } from "./create-webgl-renderer";

export async function createWebgpuRenderer(canvas: HTMLCanvasElement) {
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
    alphaMode: 'opaque',
  })

  const basicShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      color: vec4f,
      matrix: mat3x3f,
      flipY: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    @vertex
    fn vertex_main(@location(0) position: vec2f) -> @builtin(position) vec4f
    {
      return vec4f((uniforms.matrix * vec3(position.xy, 1)).xy * vec2(1, uniforms.flipY), 0, 1);
    }
    
    @fragment
    fn fragment_main() -> @location(0) vec4f
    {
      return uniforms.color;
    }`
  }))
  const coloredTextureShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      matrix: mat3x3f,
      color: vec4f,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var mySampler: sampler;
    @group(0) @binding(2) var myTexture: texture_2d<f32>;

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) texcoord: vec2f,
    };
    
    @vertex
    fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput
    {
      var pos = array<vec2f, 6>(
        vec2f(0.0, 0.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
      );
      let xy = pos[vertexIndex];
      var vsOut: VertexOutput;
      vsOut.position = vec4f((uniforms.matrix * vec3(xy, 1)).xy, 0, 1);
      vsOut.texcoord = xy;
      return vsOut;
    }
    
    @fragment
    fn fragment_main(@location(0) texcoord: vec2f) -> @location(0) vec4f
    {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 || texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
      var color = textureSample(myTexture, mySampler, texcoord) * uniforms.color;
      if (color.a < 0.1) {
        discard;
      }
      return color;
    }`
  }))
  const textureShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      matrix: mat3x3f,
      opacity: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var mySampler: sampler;
    @group(0) @binding(2) var myTexture: texture_2d<f32>;

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) texcoord: vec2f,
    };
    
    @vertex
    fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput
    {
      var pos = array<vec2f, 6>(
        vec2f(0.0, 0.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
      );
      let xy = pos[vertexIndex];
      var vsOut: VertexOutput;
      vsOut.position = vec4f((uniforms.matrix * vec3(xy, 1)).xy, 0, 1);
      vsOut.texcoord = xy;
      return vsOut;
    }
    
    @fragment
    fn fragment_main(@location(0) texcoord: vec2f) -> @location(0) vec4f
    {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 || texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
      return textureSample(myTexture, mySampler, texcoord) * vec4f(1, 1, 1, uniforms.opacity);
    }`
  }))

  const sampler = new Lazy(() => device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest',
  }));

  const bufferCache = new WeakmapCache<number[], GPUBuffer>()
  const basicPipelineCache = new MapCache<LineOrTriangleGraphic['type'], GPURenderPipeline>()
  const canvasTextureCache = new WeakmapCache<ImageData | ImageBitmap, GPUTexture>()
  const texturePipelineCache = new MapCache<GPUShaderModule, GPURenderPipeline>()

  const drawGraphic = (graphic: Graphic, matrix: Matrix, passEncoder: GPURenderPassEncoder) => {
    const color = mergeOpacityToColor(graphic.color, graphic.opacity)

    if (graphic.type === 'texture') {
      let textureMatrix = m3.multiply(matrix, m3.translation(graphic.x, graphic.y))
      const width = graphic.width ?? graphic.src.width
      const height = graphic.height ?? graphic.src.height
      textureMatrix = m3.multiply(textureMatrix, m3.scaling(width, height))

      const tex = canvasTextureCache.get(graphic.src, () => {
        const texture = device.createTexture({
          format: 'rgba8unorm',
          size: [graphic.src.width, graphic.src.height],
          usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
        });
        if (graphic.src instanceof ImageBitmap) {
          device.queue.copyExternalImageToTexture(
            { source: graphic.src },
            { texture },
            { width: graphic.src.width, height: graphic.src.height },
          );
        } else if (graphic.canvas) {
          device.queue.copyExternalImageToTexture(
            { source: graphic.canvas },
            { texture },
            { width: graphic.src.width, height: graphic.src.height },
          );
        }
        return texture
      })
      const shaderModule = graphic.color ? coloredTextureShaderModule.instance : textureShaderModule.instance
      const pipeline = texturePipelineCache.get(shaderModule, () => device.createRenderPipeline({
        vertex: {
          module: shaderModule,
          entryPoint: 'vertex_main',
        },
        fragment: {
          module: graphic.color ? coloredTextureShaderModule.instance : textureShaderModule.instance,
          entryPoint: 'fragment_main',
          targets: [{ format }]
        },
        layout: 'auto',
      }))
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0, resource: {
              buffer: createUniformsBuffer(device, [
                { type: 'mat3x3', value: textureMatrix },
                graphic.color ? { type: 'vec4', value: graphic.color } : { type: 'number', value: graphic.opacity ?? 1 },
              ])
            }
          },
          { binding: 1, resource: sampler.instance },
          { binding: 2, resource: tex.createView() },
        ],
      }));
      passEncoder.draw(6);
    } else if (graphic.type !== 'triangle fan') {
      const pipeline = basicPipelineCache.get(graphic.type, () => device.createRenderPipeline({
        vertex: {
          module: basicShaderModule.instance,
          entryPoint: 'vertex_main',
          buffers: [{
            attributes: [{
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2'
            }],
            arrayStride: 8,
            stepMode: 'vertex'
          }]
        },
        fragment: {
          module: basicShaderModule.instance,
          entryPoint: 'fragment_main',
          targets: [{ format }]
        },
        primitive: {
          topology: graphic.type === 'triangles' ? 'triangle-list'
            : graphic.type === 'line strip' ? 'line-strip'
              : graphic.type === 'lines' ? 'line-list' : 'triangle-strip',
        },
        layout: 'auto',
      }))
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0, resource: {
              buffer: createUniformsBuffer(device, [
                { type: 'vec4', value: color || defaultVec4Color },
                { type: 'mat3x3', value: matrix },
                { type: 'number', value: 1 },
              ])
            }
          },
        ],
      }));
      passEncoder.setVertexBuffer(0, bufferCache.get(graphic.points, () => {
        const vertices = new Float32Array(graphic.points)
        const buffer = device.createBuffer({
          size: vertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        device.queue.writeBuffer(buffer, 0, vertices, 0, vertices.length)
        return buffer
      }));
      passEncoder.draw(graphic.points.length / 2);
    }
  }

  return (graphics: Graphic[], backgroundColor: Vec4, x: number, y: number, scale: number, rotate?: number) => {
    let worldMatrix = m3.projection(canvas.width, canvas.height)
    worldMatrix = m3.multiply(worldMatrix, m3.translation(x, y))
    if (scale !== 1) {
      worldMatrix = m3.multiply(worldMatrix, m3.translation(canvas.width / 2, canvas.height / 2));
      worldMatrix = m3.multiply(worldMatrix, m3.scaling(scale, scale));
      worldMatrix = m3.multiply(worldMatrix, m3.translation(-canvas.width / 2, -canvas.height / 2));
    }
    if (rotate) {
      worldMatrix = m3.multiply(worldMatrix, m3.rotation(-rotate));
    }

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        clearValue: backgroundColor,
        loadOp: 'clear',
        storeOp: 'store',
        view: context.getCurrentTexture().createView()
      }]
    });
    for (const graphic of graphics) {
      const matrix = graphic.matrix ? m3.multiply(worldMatrix, graphic.matrix) : worldMatrix
      drawGraphic(graphic, matrix, passEncoder)
    }
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
}

function createUniformsBuffer(device: GPUDevice, inputs: MemoryLayoutInput[]) {
  const uniformValues = createMemoryLayoutArray(...inputs)
  const uniformBuffer = device.createBuffer({
    size: uniformValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, uniformValues)
  return uniformBuffer
}
