/// <reference types="@webgpu/types" />
import { Lazy } from "../../utils/lazy";
import { mergeOpacities, mergeOpacityToColor } from "../../utils/color";
import { Matrix, m3 } from "../../utils/matrix";
import { MemoryLayoutInput, createMemoryLayoutArray } from "../../utils/memory-layout";
import { Vec4 } from "../../utils/types";
import { MapCache2, WeakmapCache, WeakmapCache2, WeakmapMap2Cache } from "../../utils/weakmap-cache";
import { Graphic, LineOrTriangleGraphic, PatternGraphic, defaultVec4Color, getNumArrayPointsBounding, getTextureGraphicMatrix, getWorldMatrix, forEachPatternGraphicRepeatedGraphic, FilterGraphic } from "./create-webgl-renderer";
import { Bounding } from "../../utils/bounding";

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
  })
  const blend: GPUBlendState = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
  }

  const basicShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      color: vec4f,
      matrix: mat3x3f,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    @vertex
    fn vertex_main(@location(0) position: vec2f) -> @builtin(position) vec4f
    {
      return vec4f((uniforms.matrix * vec3(position, 1)).xy, 0, 1);
    }
    
    @fragment
    fn fragment_main() -> @location(0) vec4f
    {
      return uniforms.color;
    }`
  }))
  const scaledShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      color: vec4f,
      matrix: mat3x3f,
      scale: f32,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    @vertex
    fn vertex_main(@location(0) position: vec2f, @location(1) base: vec2f) -> @builtin(position) vec4f
    {
      let p = (position - base) * uniforms.scale + base;
      return vec4f((uniforms.matrix * vec3(p, 1)).xy, 0, 1);
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
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, 0.0),
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
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, 0.0),
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
  const colorMatrixTextureShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      matrix: mat3x3f,
      opacity: f32,
      colorMatrix: array<vec4f, 5>,
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
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, 0.0),
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
      var c = textureSample(myTexture, mySampler, texcoord) * vec4f(1, 1, 1, uniforms.opacity);
      var r = uniforms.colorMatrix[0][0] * c.r + uniforms.colorMatrix[0][1] * c.g + uniforms.colorMatrix[0][2] * c.b + uniforms.colorMatrix[0][3] * c.a + uniforms.colorMatrix[1][0];
      var g = uniforms.colorMatrix[1][1] * c.r + uniforms.colorMatrix[1][2] * c.g + uniforms.colorMatrix[1][3] * c.b + uniforms.colorMatrix[2][0] * c.a + uniforms.colorMatrix[2][1];
      var b = uniforms.colorMatrix[2][2] * c.r + uniforms.colorMatrix[2][3] * c.g + uniforms.colorMatrix[3][0] * c.b + uniforms.colorMatrix[3][1] * c.a + uniforms.colorMatrix[3][2];
      var a = uniforms.colorMatrix[3][3] * c.r + uniforms.colorMatrix[4][0] * c.g + uniforms.colorMatrix[4][1] * c.b + uniforms.colorMatrix[4][2] * c.a + uniforms.colorMatrix[4][3];
      return vec4f(r, g, b, a);
    }`
  }))
  const blurTextureShaderModule = new Lazy(() => device.createShaderModule({
    code: `struct Uniforms {
      matrix: mat3x3f,
      opacity: f32,
      px: vec4f,
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
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, 0.0),
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
      var r = vec4f(0.0);
      r += textureSample(myTexture, mySampler, texcoord + vec2(-7.0*uniforms.px.x, -7.0*uniforms.px.y))*0.0044299121055113265;
      r += textureSample(myTexture, mySampler, texcoord + vec2(-6.0*uniforms.px.x, -6.0*uniforms.px.y))*0.00895781211794;
      r += textureSample(myTexture, mySampler, texcoord + vec2(-5.0*uniforms.px.x, -5.0*uniforms.px.y))*0.0215963866053;
      r += textureSample(myTexture, mySampler, texcoord + vec2(-4.0*uniforms.px.x, -4.0*uniforms.px.y))*0.0443683338718;
      r += textureSample(myTexture, mySampler, texcoord + vec2(-3.0*uniforms.px.x, -3.0*uniforms.px.y))*0.0776744219933;
      r += textureSample(myTexture, mySampler, texcoord + vec2(-2.0*uniforms.px.x, -2.0*uniforms.px.y))*0.115876621105;
      r += textureSample(myTexture, mySampler, texcoord + vec2(-1.0*uniforms.px.x, -1.0*uniforms.px.y))*0.147308056121;
      r += textureSample(myTexture, mySampler, texcoord                                               )*0.159576912161;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 1.0*uniforms.px.x,  1.0*uniforms.px.y))*0.147308056121;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 2.0*uniforms.px.x,  2.0*uniforms.px.y))*0.115876621105;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 3.0*uniforms.px.x,  3.0*uniforms.px.y))*0.0776744219933;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 4.0*uniforms.px.x,  4.0*uniforms.px.y))*0.0443683338718;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 5.0*uniforms.px.x,  5.0*uniforms.px.y))*0.0215963866053;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 6.0*uniforms.px.x,  6.0*uniforms.px.y))*0.00895781211794;
      r += textureSample(myTexture, mySampler, texcoord + vec2( 7.0*uniforms.px.x,  7.0*uniforms.px.y))*0.0044299121055113265;
      return r;
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
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, 0.0),
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
      vsOut.position = vec4f((uniforms.matrix * vec3(position, 1)).xy, 0, 1);
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
  }), t => t.destroy())
  const stencilTexture = new Lazy(() => device.createTexture({
    format: 'stencil8',
    sampleCount,
    size: [canvas.width, canvas.height],
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  }), t => t.destroy())

  type State = 'normal' | 'mask' | 'masked'
  const bufferCache = new WeakmapCache<number[], GPUBuffer>()
  const scaledBufferCache = new WeakmapCache2<number[], number[], GPUBuffer>()
  const gradientBufferCache = new WeakmapCache2<number[], number[], GPUBuffer>()
  const basicPipelineCache = new WeakmapMap2Cache<GPUShaderModule, LineOrTriangleGraphic['type'], State, GPURenderPipeline>()
  const canvasTextureCache = new WeakmapCache<ImageData | ImageBitmap, GPUTexture>()
  const texturePipelineCache = new MapCache2<GPUShaderModule, State, GPURenderPipeline>()

  const getFilterShaderModuleAndUniforms = (filter: FilterGraphic) => {
    if (filter.type === 'color matrix') {
      return {
        shaderModule: colorMatrixTextureShaderModule.instance,
        input: { type: 'vec4 array' as const, count: 5, value: filter.value },
      }
    } else {
      return {
        shaderModule: blurTextureShaderModule.instance,
        input: { type: 'vec2' as const, value: filter.value },
      }
    }
  }
  const createRenderPipeline = (shaderModule: GPUShaderModule, state: State, type?: LineOrTriangleGraphic['type'], bufferLayout?: GPUVertexBufferLayout) => {
    return device.createRenderPipeline({
      vertex: {
        module: shaderModule,
        entryPoint: 'vertex_main',
        buffers: bufferLayout ? [bufferLayout] : undefined,
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragment_main',
        targets: state === 'mask' ? [] : [{ format, blend }]
      },
      depthStencil: state === 'mask' ? {
        format: 'stencil8',
        depthCompare: 'always',
        depthWriteEnabled: false,
        stencilFront: {
          passOp: 'replace',
        },
      } : state === 'masked' ? {
        depthCompare: 'always',
        depthWriteEnabled: false,
        format: 'stencil8',
        stencilFront: {
          compare: 'equal',
        },
      } : undefined,
      primitive: type ? {
        topology: type === 'triangles' ? 'triangle-list'
          : type === 'line strip' ? 'line-strip'
            : type === 'lines' ? 'line-list' : 'triangle-strip',
      } : undefined,
      multisample: {
        count: sampleCount,
      },
      label: state,
      layout: 'auto',
    })
  }
  const setPipelineAndResources = (passEncoder: GPURenderPassEncoder, pipeline: GPURenderPipeline, resources: GPUBindingResource[]) => {
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: resources.map((e, i) => ({ binding: i, resource: e })),
    }))
  }
  const drawTexture = (shaderModule: GPUShaderModule, passEncoder: GPURenderPassEncoder, inputs: MemoryLayoutInput[], texture: GPUTexture, state: State = 'normal') => {
    const pipeline = texturePipelineCache.get(shaderModule, state, () => createRenderPipeline(shaderModule, state))
    setPipelineAndResources(passEncoder, pipeline, [{ buffer: createUniformsBuffer(device, inputs) }, sampler.instance, texture.createView()])
    passEncoder.draw(6);
  }
  const createTexture = (width: number, height: number) => {
    return device.createTexture({
      size: [width, height],
      format,
      usage: GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    })
  }
  const createRenderPass = (commandEncoder: GPUCommandEncoder, targetTexture = context.getCurrentTexture(), backgroundColor?: Vec4) => commandEncoder.beginRenderPass({
    colorAttachments: [{
      clearValue: backgroundColor,
      loadOp: backgroundColor ? 'clear' : 'load',
      storeOp: 'store',
      view: sampleTexture.instance.createView(),
      resolveTarget: targetTexture.createView()
    }],
    label: 'normal'
  })
  const createMaskRenderPass = (commandEncoder: GPUCommandEncoder) => {
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [],
      depthStencilAttachment: {
        view: stencilTexture.instance.createView(),
        stencilClearValue: 0,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store',
      },
      label: 'mask'
    })
    renderPass.setStencilReference(1)
    return renderPass
  }
  const createMaskedRenderPass = (commandEncoder: GPUCommandEncoder, targetTexture = context.getCurrentTexture(), reference = 1) => {
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: sampleTexture.instance.createView(),
        resolveTarget: targetTexture.createView(),
        loadOp: reference === 0 ? 'clear' : 'load',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: stencilTexture.instance.createView(),
        stencilLoadOp: 'load',
        stencilStoreOp: 'store',
      },
      label: 'masked'
    })
    renderPass.setStencilReference(reference)
    return renderPass
  }

  const drawPattern = (pattern: PatternGraphic, matrix: Matrix, bounding: Bounding, commandEncoder: GPUCommandEncoder, opacity?: number, targetTexture?: GPUTexture) => {
    let texture: GPUTexture | undefined
    const byFramebuffer = pattern.graphics.some(p => p.pattern)
    if (byFramebuffer) {
      texture = createTexture(canvas.width, canvas.height);
      const framebufferCommandEncoder = device.createCommandEncoder();
      let framebufferPassEncoder = createMaskedRenderPass(framebufferCommandEncoder, texture, 0)
      forEachPatternGraphicRepeatedGraphic(pattern, matrix, bounding, (g, m) => {
        framebufferPassEncoder = drawGraphic(g, m, framebufferPassEncoder, framebufferCommandEncoder, true, opacity, texture)
      })
      framebufferPassEncoder.end();
      device.queue.submit([framebufferCommandEncoder.finish()]);
    }
    let passEncoder = createMaskedRenderPass(commandEncoder)
    if (texture) {
      drawTexture(textureShaderModule.instance, passEncoder, [{ type: 'mat3x3', value: m3.projection(1, 1) }, { type: 'number', value: opacity ?? 1 }], texture, 'masked')
    } else {
      forEachPatternGraphicRepeatedGraphic(pattern, matrix, bounding, (g, m) => {
        passEncoder = drawGraphic(g, m, passEncoder, commandEncoder, true, opacity, targetTexture)
      })
    }
    passEncoder.end();
    return createRenderPass(commandEncoder, targetTexture)
  }
  const drawGraphic = (graphic: Graphic, matrix: Matrix, passEncoder: GPURenderPassEncoder, commandEncoder: GPUCommandEncoder, inPattern = false, opacity?: number, targetTexture?: GPUTexture, scale?: number) => {
    const op = mergeOpacities(graphic.opacity, opacity)
    const color = mergeOpacityToColor(graphic.pattern ? defaultVec4Color : graphic.color, op)
    if (graphic.pattern) {
      passEncoder.end()
      passEncoder = createMaskRenderPass(commandEncoder)
    }
    const state = graphic.pattern ? 'mask' : inPattern && passEncoder.label === 'masked' ? 'masked' : 'normal'

    if (graphic.type === 'texture') {
      const { textureMatrix, width, height } = getTextureGraphicMatrix(matrix, graphic)

      let texture = canvasTextureCache.get(graphic.src, () => {
        const gpuTexture = createTexture(graphic.src.width, graphic.src.height)
        const source = graphic.src instanceof ImageBitmap ? graphic.src : graphic.canvas
        if (source) {
          device.queue.copyExternalImageToTexture({ source }, { texture: gpuTexture }, { width: graphic.src.width, height: graphic.src.height })
        }
        return gpuTexture
      })
      if (graphic.filters && graphic.filters.length > 1) {
        const textures: GPUTexture[] = []
        for (let i = 0; i < graphic.filters.length - 1; i++) {
          let filterTexture: GPUTexture
          if (textures.length < 2) {
            filterTexture = createTexture(canvas.width, canvas.height)
            textures.push(filterTexture)
          } else {
            filterTexture = textures[i % 2]
          }
          const filterCommandEncoder = device.createCommandEncoder();
          const filterPassEncoder = createRenderPass(filterCommandEncoder, filterTexture)
          const p = getFilterShaderModuleAndUniforms(graphic.filters[i])
          drawTexture(p.shaderModule, filterPassEncoder, [{ type: 'mat3x3', value: m3.projection(1, 1) }, { type: 'number', value: graphic.opacity ?? 1 }, p.input], texture)
          filterPassEncoder.end();
          device.queue.submit([filterCommandEncoder.finish()]);
          texture = filterTexture
        }
      }
      let shaderModule: GPUShaderModule
      const inputs: MemoryLayoutInput[] = [{ type: 'mat3x3', value: textureMatrix }]
      if (graphic.filters && graphic.filters.length > 0) {
        const p = getFilterShaderModuleAndUniforms(graphic.filters[graphic.filters.length - 1])
        shaderModule = p.shaderModule
        inputs.push({ type: 'number', value: graphic.opacity ?? 1 }, p.input)
      } else if (graphic.pattern) {
        shaderModule = colorMaskedTextureShaderModule.instance
        inputs.push({ type: 'vec4', value: color ?? defaultVec4Color })
      } else if (graphic.color) {
        shaderModule = coloredTextureShaderModule.instance
        inputs.push({ type: 'vec4', value: color ?? defaultVec4Color })
      } else {
        shaderModule = textureShaderModule.instance
        inputs.push({ type: 'number', value: graphic.opacity ?? 1 })
      }
      drawTexture(shaderModule, passEncoder, inputs, texture, state)

      if (graphic.pattern) {
        passEncoder.end()
        passEncoder = drawPattern(graphic.pattern, matrix, { xMin: graphic.x, yMin: graphic.y, xMax: graphic.x + width, yMax: graphic.y + height }, commandEncoder, op, targetTexture)
      }
    } else {
      const shaderModule = graphic.colors ? gradientShaderModule.instance : graphic.basePoints && scale ? scaledShaderModule.instance : basicShaderModule.instance
      const pipeline = basicPipelineCache.get(shaderModule, graphic.type, state, () => {
        const bufferLayout: GPUVertexBufferLayout = graphic.colors ? {
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: "float32x4" },
          ],
          arrayStride: 24,
          stepMode: 'vertex'
        } : graphic.basePoints && scale ? {
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x2' },
          ],
          arrayStride: 16,
          stepMode: 'vertex'
        } : {
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
          ],
          arrayStride: 8,
          stepMode: 'vertex'
        }
        return createRenderPipeline(shaderModule, state, graphic.type, bufferLayout)
      })
      const input: MemoryLayoutInput[] = [{ type: 'vec4', value: color || defaultVec4Color }, { type: 'mat3x3', value: matrix }]
      if (graphic.basePoints && scale) {
        input.push({ type: 'number', value: 1 / scale })
      }
      setPipelineAndResources(passEncoder, pipeline, [{ buffer: createUniformsBuffer(device, input) }])
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
      } else if (graphic.basePoints && scale) {
        const basePoints = graphic.basePoints
        passEncoder.setVertexBuffer(0, scaledBufferCache.get(graphic.points, basePoints, () => {
          const result = mergeVertexData([{ data: graphic.points, num: 2 }, { data: basePoints, num: 2 }])
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
        passEncoder.end()
        const bounding = getNumArrayPointsBounding(graphic.points)
        passEncoder = drawPattern(graphic.pattern, matrix, bounding, commandEncoder, op, targetTexture)
      }
    }
    return passEncoder
  }

  const resizeCanvasToDisplaySize = () => {
    if (sampleTexture.instanced && (canvas.width !== sampleTexture.instance.width || canvas.height !== sampleTexture.instance.height)) {
      sampleTexture.reset()
    }
    if (stencilTexture.instanced && (canvas.width !== stencilTexture.instance.width || canvas.height !== stencilTexture.instance.height)) {
      stencilTexture.reset()
    }
  }

  return (graphics: Graphic[], backgroundColor: Vec4, x: number, y: number, scale: number, rotate?: number) => {
    resizeCanvasToDisplaySize()
    const worldMatrix = getWorldMatrix(canvas, x, y, scale, rotate)

    const commandEncoder = device.createCommandEncoder();
    let passEncoder = createRenderPass(commandEncoder, undefined, backgroundColor)
    for (const graphic of graphics) {
      const matrix = graphic.matrix ? m3.multiply(worldMatrix, graphic.matrix) : worldMatrix
      passEncoder = drawGraphic(graphic, matrix, passEncoder, commandEncoder, undefined, undefined, undefined, scale)
    }
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
}

export function createUniformsBuffer(device: GPUDevice, inputs: MemoryLayoutInput[]) {
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
