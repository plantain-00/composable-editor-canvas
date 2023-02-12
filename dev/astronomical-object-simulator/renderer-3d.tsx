import React from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { Nullable } from '../../src';
import { BaseContent, isSphereContent, SphereContent } from './model';

export function Renderer3d(props: {
  contents: readonly Nullable<BaseContent>[]
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const spheres = React.useRef<(THREE.Mesh | null)[]>([])
  const speeds = React.useRef<(THREE.Line | null)[]>([])
  const accelerations = React.useRef<(THREE.Line | null)[]>([])
  const lastContents = React.useRef<readonly Nullable<BaseContent>[]>(props.contents)

  React.useEffect(() => {
    if (!ref.current) return

    const perspectiveCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
    perspectiveCamera.position.z = 1000;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    spheres.current = []
    speeds.current = []
    accelerations.current = []
    for (const content of props.contents) {
      if (content && isSphereContent(content)) {
        const geometry = new THREE.SphereGeometry(content.radius, 72, 36);
        const material = new THREE.MeshLambertMaterial({ color: content.color, flatShading: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = content.x
        mesh.position.y = content.y
        mesh.position.z = content.z
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);
        spheres.current.push(mesh)

        const speed = new THREE.Line(getSpeedGeometry(content), new THREE.LineBasicMaterial({ color: content.color }));
        scene.add(speed);
        speeds.current.push(speed);

        const acceleration = new THREE.Line(getAccelerationGeometry(content), new THREE.LineDashedMaterial({ color: content.color, dashSize: 4, gapSize: 4 }));
        acceleration.computeLineDistances();
        scene.add(acceleration);
        accelerations.current.push(acceleration);
      } else {
        spheres.current.push(null)
        speeds.current.push(null)
        accelerations.current.push(null)
      }
    }

    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(0, 0, 1);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: ref.current });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const resize = () => {
      perspectiveCamera.aspect = window.innerWidth / window.innerHeight;
      perspectiveCamera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      controls.handleResize();
    }
    window.addEventListener('resize', resize);

    const controls = new TrackballControls(perspectiveCamera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.keys = ['KeyA', 'KeyS', 'KeyD'];

    let handle: number
    function animate() {
      handle = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, perspectiveCamera);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (handle) {
        cancelAnimationFrame(handle)
      }
    }
  }, [ref.current])

  React.useEffect(() => {
    for (let i = 0; i < props.contents.length; i++) {
      const content = props.contents[i]
      const lastContent = lastContents.current[i]
      if (lastContent === content) continue
      if (content && isSphereContent(content)) {
        const mesh = spheres.current[i]
        if (mesh) {
          mesh.position.x = content.x
          mesh.position.y = content.y
          mesh.position.z = content.z
          mesh.updateMatrix()

          if (lastContent && isSphereContent(lastContent)) {
            if (lastContent.color !== content.color && mesh.material instanceof THREE.MeshLambertMaterial) {
              mesh.material.color.set(content.color)
            }
            if (lastContent.radius !== content.radius) {
              mesh.geometry.dispose()
              mesh.geometry = new THREE.SphereGeometry(content.radius, 72, 36)
            }
          }
        }

        const speed = speeds.current[i]
        if (speed) {
          speed.geometry.dispose()
          speed.geometry = getSpeedGeometry(content)
        }

        const acceleration = accelerations.current[i]
        if (acceleration) {
          acceleration.geometry.dispose()
          acceleration.geometry = getAccelerationGeometry(content)
          acceleration.computeLineDistances()
        }
      }
    }
    lastContents.current = props.contents
  }, [props.contents])

  return (
    <canvas ref={ref} />
  )
}

function getSpeedGeometry(content: SphereContent) {
  const start = new THREE.Vector3(content.x, content.y, content.z)
  const speed = new THREE.Vector3(content.speed.x, content.speed.y, content.speed.z)
  const end = start.clone().addScaledVector(speed.clone().normalize(), speed.length() + content.radius)
  return new THREE.BufferGeometry().setFromPoints([start, end])
}

function getAccelerationGeometry(content: SphereContent) {
  const start = new THREE.Vector3(content.x, content.y, content.z)
  const acceleration = new THREE.Vector3(content.acceleration?.x ?? 0, content.acceleration?.y ?? 0, content.acceleration?.z ?? 0)
  const end = start.clone().addScaledVector(acceleration.clone().normalize(), acceleration.length() + content.radius)
  return new THREE.BufferGeometry().setFromPoints([start, end])
}