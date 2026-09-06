import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { addAfterEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  Box3,
  MathUtils,
  PCFSoftShadowMap,
  Spherical,
  Vector3,
} from "three";

const SKY = "#e8edf0";

function CameraRig({
  dimensions,
  view,
  command,
  active,
  rotating,
  reducedMotion,
  controlsRef,
}) {
  const { camera, size, invalidate } = useThree();
  const scratch = useMemo(
    () => ({ offset: new Vector3(), spherical: new Spherical() }),
    [],
  );

  const frameModel = () => {
    const [width, height, depth] = dimensions;
    const target = new Vector3(0, view === "top" ? 0 : height * 0.36, 0);
    const direction =
      view === "top"
        ? new Vector3(0.001, 1, 0.001).normalize()
        : new Vector3(1.1, 0.92, 1.35).normalize();
    const right = new Vector3()
      .crossVectors(new Vector3(0, 1, 0), direction)
      .normalize();
    const up = new Vector3().crossVectors(direction, right).normalize();
    const verticalTangent = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const horizontalTangent =
      verticalTangent * (size.width / Math.max(1, size.height));
    let distance = 0;
    for (const x of [-width / 2, width / 2]) {
      for (const y of [0, height]) {
        for (const z of [-depth / 2, depth / 2]) {
          const point = new Vector3(x, y, z).sub(target);
          distance = Math.max(
            distance,
            point.dot(direction) +
              Math.abs(point.dot(right)) / horizontalTangent,
            point.dot(direction) + Math.abs(point.dot(up)) / verticalTangent,
          );
        }
      }
    }
    distance *= 1.22;
    camera.position.copy(target).addScaledVector(direction, distance);
    camera.near = 0.1;
    camera.far = Math.max(140, distance * 5);
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.minDistance = Math.max(3, distance * 0.22);
      controlsRef.current.maxDistance = distance * 2.3;
      controlsRef.current.update();
    }
    invalidate();
  };

  useEffect(frameModel, [dimensions, view, size.width, size.height]);

  useEffect(() => {
    if (!command || !controlsRef.current) return;
    const controls = controlsRef.current;
    if (command.type === "reset") {
      frameModel();
      return;
    }
    scratch.offset.copy(camera.position).sub(controls.target);
    scratch.spherical.setFromVector3(scratch.offset);
    if (command.type === "zoom-in" || command.type === "zoom-out") {
      scratch.spherical.radius = MathUtils.clamp(
        scratch.spherical.radius * (command.type === "zoom-in" ? 0.82 : 1.22),
        controls.minDistance,
        controls.maxDistance,
      );
    }
    if (command.type === "left") scratch.spherical.theta -= Math.PI / 12;
    if (command.type === "right") scratch.spherical.theta += Math.PI / 12;
    if (command.type === "up") scratch.spherical.phi -= Math.PI / 18;
    if (command.type === "down") scratch.spherical.phi += Math.PI / 18;
    scratch.spherical.phi = MathUtils.clamp(
      scratch.spherical.phi,
      0.025,
      Math.PI * 0.47,
    );
    scratch.offset.setFromSpherical(scratch.spherical);
    camera.position.copy(controls.target).add(scratch.offset);
    controls.update();
    invalidate();
  }, [command]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={active}
      enablePan={false}
      enableZoom={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.07}
      rotateSpeed={0.55}
      minPolarAngle={0.025}
      maxPolarAngle={Math.PI * 0.47}
      autoRotate={rotating && active && view !== "top"}
      autoRotateSpeed={0.65}
    />
  );
}

function Architecture({
  model,
  mode,
  view,
  command,
  active,
  rotating,
  reducedMotion,
  controlsRef,
  onReady,
}) {
  const gltf = useGLTF(`${import.meta.env.BASE_URL}models/${model}.glb`);
  const { invalidate } = useThree();
  const { scene, dimensions, offset, scale, materialCopies } = useMemo(() => {
    const sceneCopy = gltf.scene.clone(true);
    const materialCopies = [];
    sceneCopy.traverse((object) => {
      if (!object.isMesh) return;
      const cloneMaterial = (original) => {
        const copy = original.clone();
        materialCopies.push(copy);
        return copy;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material);
      object.castShadow = true;
      object.receiveShadow = true;
      object.userData.initialVisibility = object.visible;
    });
    const box = new Box3().setFromObject(sceneCopy);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scalar = 10 / Math.max(size.x, size.y, size.z, 0.001);
    return {
      scene: sceneCopy,
      dimensions: [size.x * scalar, size.y * scalar, size.z * scalar],
      offset: [-center.x * scalar, -box.min.y * scalar, -center.z * scalar],
      scale: scalar,
      materialCopies,
    };
  }, [gltf.scene]);

  useEffect(
    () => () => {
      materialCopies.forEach((material) => material.dispose());
    },
    [materialCopies],
  );
  useEffect(() => {
    let structures = 0;
    scene.traverse((object) => {
      if (object.isMesh && /^Structure/i.test(object.name)) structures += 1;
    });
    scene.traverse((object) => {
      if (!object.isMesh) return;
      object.visible =
        object.userData.initialVisibility &&
        !(mode === "structure" && structures && /^Facade/i.test(object.name));
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials)
        material.wireframe =
          mode === "structure" &&
          !structures &&
          !/^Landscape/i.test(object.name);
    });
    invalidate();
  }, [scene, mode, invalidate]);
  useEffect(() => {
    onReady();
    invalidate();
  }, [onReady, invalidate, scene]);

  return (
    <>
      <group position={offset} scale={scale}>
        <primitive object={scene} dispose={null} />
      </group>
      <CameraRig
        dimensions={dimensions}
        view={view}
        command={command}
        active={active}
        rotating={rotating}
        reducedMotion={reducedMotion}
        controlsRef={controlsRef}
      />
    </>
  );
}

function SceneLifecycle({ surfaceRef, controlsRef, onFailure, spinning }) {
  const { gl, camera } = useThree();
  const frames = useRef(0);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event) => {
      event.preventDefault();
      onFailure("context-lost");
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useFrame(() => {
    frames.current += 1;
  });
  useEffect(() => {
    let sampledFrame = -1;
    // useFrame runs before gl.render. Sample after rendering so a single
    // demand frame reports its own geometry, rather than the preceding view.
    return addAfterEffect(() => {
      if (sampledFrame === frames.current) return;
      sampledFrame = frames.current;
      if (
        !surfaceRef.current ||
        (spinning && frames.current >= 5 && frames.current % 20 !== 0)
      )
        return;
      const data = surfaceRef.current.dataset;
      data.frames = String(frames.current);
      data.drawCalls = String(gl.info.render.calls);
      data.triangles = String(gl.info.render.triangles);
      data.azimuth = String(
        controlsRef.current?.getAzimuthalAngle().toFixed(3) || 0,
      );
      data.distance = String(
        controlsRef.current
          ? camera.position.distanceTo(controlsRef.current.target).toFixed(3)
          : 0,
      );
    });
  }, [gl, camera, controlsRef, surfaceRef, spinning]);
  return null;
}

export default function SceneCanvas({
  model,
  active,
  rotating,
  reducedMotion,
  mode,
  view,
  command,
  onReady,
  onFailure,
}) {
  const surfaceRef = useRef(null);
  const controlsRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const lowPower =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2");
      if (!context) {
        onFailure("unsupported");
        return;
      }
      context.getExtension("WEBGL_lose_context")?.loseContext();
      setSupported(true);
    } catch {
      onFailure("unsupported");
    }
  }, [onFailure]);
  if (!supported) return null;
  return (
    <div
      ref={surfaceRef}
      className="fort-model__canvas"
      data-scene-surface
      aria-hidden="true"
    >
      <Canvas
        frameloop={active && rotating && view !== "top" ? "always" : "demand"}
        dpr={lowPower ? 1 : [1, 1.5]}
        camera={{ position: [15, 13, 18], fov: 38, near: 0.1, far: 180 }}
        shadows={PCFSoftShadowMap}
        gl={{
          antialias: !lowPower,
          alpha: false,
          powerPreference: "low-power",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        fallback={<span>Архитектурная концепция</span>}
      >
        <color attach="background" args={[SKY]} />
        <ambientLight intensity={0.7} />
        <hemisphereLight
          color="#eef5ff"
          groundColor="#c8b9a5"
          intensity={1.1}
        />
        <directionalLight
          position={[8, 16, 9]}
          intensity={3.1}
          color="#fff3df"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-normalBias={0.035}
          shadow-bias={-0.00015}
        />
        <directionalLight
          position={[-8, 6, -5]}
          intensity={1.2}
          color="#dceafb"
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.025, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color={SKY} roughness={1} />
        </mesh>
        <Suspense fallback={null}>
          <Architecture
            model={model}
            mode={mode}
            view={view}
            command={command}
            active={active}
            rotating={rotating}
            reducedMotion={reducedMotion}
            controlsRef={controlsRef}
            onReady={onReady}
          />
        </Suspense>
        <SceneLifecycle
          surfaceRef={surfaceRef}
          controlsRef={controlsRef}
          onFailure={onFailure}
          spinning={active && rotating && view !== "top"}
        />
      </Canvas>
    </div>
  );
}

export function clearModelCache(model) {
  useGLTF.clear(`${import.meta.env.BASE_URL}models/${model}.glb`);
}
