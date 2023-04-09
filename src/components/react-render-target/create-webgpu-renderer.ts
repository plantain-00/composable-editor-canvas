/// <reference types="@webgpu/types" />
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

  const basicShaderModule = device.createShaderModule({
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
  })

  const bufferCache = new WeakmapCache<number[], GPUBuffer>()
  const basicPipelineCache = new MapCache<LineOrTriangleGraphic['type'], GPURenderPipeline>()

  const drawGraphic = (graphic: Graphic, matrix: Matrix, passEncoder: GPURenderPassEncoder) => {
    const color = mergeOpacityToColor(graphic.color, graphic.opacity)

    if (graphic.type !== 'texture' && graphic.type !== 'triangle fan') {
      const pipeline = basicPipelineCache.get(graphic.type, () => device.createRenderPipeline({
        vertex: {
          module: basicShaderModule,
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
          module: basicShaderModule,
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
