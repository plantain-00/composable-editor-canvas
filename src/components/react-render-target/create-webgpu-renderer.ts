/// <reference types="@webgpu/types" />
import { Lazy } from "../../utils/lazy";
import { mergeOpacityToColor } from "../../utils/color";
import { Matrix, m3 } from "../../utils/matrix";
import { MemoryLayoutInput, createMemoryLayoutArray } from "../../utils/memory-layout";
import { Vec4 } from "../../utils/types";
import { MapCache, WeakmapCache, WeakmapCache2, WeakmapMapCache } from "../../utils/weakmap-cache";
import { Graphic, LineOrTriangleGraphic, PatternGraphic, defaultVec4Color, getNumArrayPointsBounding, getTextureGraphicMatrix, getWorldMatrix, forEachPatternGraphicRepeatedGraphic } from "./create-webgl-renderer";
import { Bounding } from "../../utils/geometry";

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
  const blend: GPUBlendState = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
  }

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
  const colorMaskedTextureShaderModule = new Lazy(() => device.createShaderModule({
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
      var color = textureSample(myTexture, mySampler, texcoord);
      var color2 = color * uniforms.color;
      if (color2.a < 0.1) {
        discard;
      }
      return color;
    }`
  }))
  const gradientShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      color: vec4f,
      matrix: mat3x3f,
      flipY: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
    };
    
    @vertex
    fn vertex_main(@location(0) position: vec2f, @location(1) color: vec4f) -> VertexOutput
    {
      var vsOut: VertexOutput;
      vsOut.position = vec4f((uniforms.matrix * vec3(position.xy, 1)).xy * vec2(1, uniforms.flipY), 0, 1);
      vsOut.color = color;
      return vsOut;
    }
    
    @fragment
    fn fragment_main(@location(0) color: vec4f) -> @location(0) vec4f
    {
      return color;
    }`
  }))

  const sampler = new Lazy(() => device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest',
  }));
  const sampleCount = 4
  const sampleTexture = new Lazy(() => device.createTexture({
    size: [canvas.width, canvas.height],
    sampleCount,
    format,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  }))

  const bufferCache = new WeakmapCache<number[], GPUBuffer>()
  const gradientBufferCache = new WeakmapCache2<number[], number[], GPUBuffer>()
  const basicPipelineCache = new WeakmapMapCache<GPUShaderModule, LineOrTriangleGraphic['type'], GPURenderPipeline>()
  const canvasTextureCache = new WeakmapCache<ImageData | ImageBitmap, GPUTexture>()
  const texturePipelineCache = new MapCache<GPUShaderModule, GPURenderPipeline>()

  const drawPattern = (pattern: PatternGraphic, matrix: Matrix, bounding: Bounding, passEncoder: GPURenderPassEncoder) => {
    forEachPatternGraphicRepeatedGraphic(pattern, matrix, bounding, (g, m) => {
      drawGraphic(g, m, passEncoder)
    })
  }
  const drawGraphic = (graphic: Graphic, matrix: Matrix, passEncoder: GPURenderPassEncoder) => {
    const color = mergeOpacityToColor(graphic.color, graphic.opacity)

    if (graphic.type === 'texture') {
      const { textureMatrix, width, height } = getTextureGraphicMatrix(matrix, graphic)

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
      let shaderModule: GPUShaderModule
      if (graphic.pattern) {
        shaderModule = colorMaskedTextureShaderModule.instance
      } else if (graphic.color) {
        shaderModule = coloredTextureShaderModule.instance
      } else {
        shaderModule = textureShaderModule.instance
      }
      const pipeline = texturePipelineCache.get(shaderModule, () => device.createRenderPipeline({
        vertex: {
          module: shaderModule,
          entryPoint: 'vertex_main',
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragment_main',
          targets: [{ format, blend }]
        },
        multisample: {
          count: sampleCount,
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

      if (graphic.pattern) {
        drawPattern(graphic.pattern, matrix, { xMin: graphic.x, yMin: graphic.y, xMax: graphic.x + width, yMax: graphic.y + height }, passEncoder)
      }
    } else if (graphic.type !== 'triangle fan') {
      const shaderModule = graphic.colors ? gradientShaderModule.instance : basicShaderModule.instance
      const pipeline = basicPipelineCache.get(shaderModule, graphic.type, () => {
        const bufferLayout: GPUVertexBufferLayout = graphic.colors ? {
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: "float32x4" },
          ],
          arrayStride: 24,
          stepMode: 'vertex'
        } : {
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
          ],
          arrayStride: 8,
          stepMode: 'vertex'
        }
        return device.createRenderPipeline({
          vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: [bufferLayout],
          },
          fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{ format, blend }]
          },
          primitive: {
            topology: graphic.type === 'triangles' ? 'triangle-list'
              : graphic.type === 'line strip' ? 'line-strip'
                : graphic.type === 'lines' ? 'line-list' : 'triangle-strip',
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
      if (graphic.colors) {
        const colors = graphic.colors
        passEncoder.setVertexBuffer(0, gradientBufferCache.get(graphic.points, colors, () => {
          const result = mergeVertexData([{ data: graphic.points, num: 2 }, { data: colors, num: 4 }])
          const vertices = new Float32Array(result)
          const buffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          })
          device.queue.writeBuffer(buffer, 0, vertices, 0, vertices.length)
          return buffer
        }));
      } else {
        passEncoder.setVertexBuffer(0, bufferCache.get(graphic.points, () => {
          const vertices = new Float32Array(graphic.points)
          const buffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          })
          device.queue.writeBuffer(buffer, 0, vertices, 0, vertices.length)
          return buffer
        }));
      }
      passEncoder.draw(graphic.points.length / 2);

      if (graphic.pattern) {
        const bounding = getNumArrayPointsBounding(graphic.points)
        drawPattern(graphic.pattern, matrix, bounding, passEncoder)
      }
    }
  }

  const resizeCanvasToDisplaySize = () => {
    if (canvas.width !== sampleTexture.instance.width || canvas.height !== sampleTexture.instance.height) {
      sampleTexture.instance.destroy()
      sampleTexture.reset()
    }
  }

  return (graphics: Graphic[], backgroundColor: Vec4, x: number, y: number, scale: number, rotate?: number) => {
    resizeCanvasToDisplaySize()
    const worldMatrix = getWorldMatrix(canvas, x, y, scale, rotate)

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        clearValue: backgroundColor,
        loadOp: 'clear',
        storeOp: 'store',
        view: sampleTexture.instance.createView(),
        resolveTarget: context.getCurrentTexture().createView()
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

function mergeVertexData(data: { data: number[], num: number }[]) {
  const result: number[] = []
  const count = Math.min(...data.map(d => d.data.length / d.num))
  for (let i = 0; i < count; i++) {
    for (const d of data) {
      result.push(...d.data.slice(i * d.num, i * d.num + d.num))
    }
  }
  return result
}
