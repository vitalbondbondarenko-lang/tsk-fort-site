import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { addAfterEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  Box3,
  EdgesGeometry,
  MathUtils,
  Spherical,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PAPER = "#f2f0e9";
const modelUrl = (model) =>
  `${import.meta.env.BASE_URL}models/${model}.glb?v=engineering-20260906`;

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
  const fitZoom = useRef(40);
  const scratch = useMemo(
    () => ({ offset: new Vector3(), spherical: new Spherical() }),
    [],
  );

  const frameModel = () => {
    const [width, height, depth] = dimensions;
    const target = new Vector3(0, height / 2, 0);
    const direction =
      view === "top"
        ? new Vector3(0, 1, 0.0001).normalize()
        : new Vector3(1, 1, 1).normalize();
    const right = new Vector3()
      .crossVectors(new Vector3(0, 1, 0), direction)
      .normalize();
    const up = new Vector3().crossVectors(direction, right).normalize();
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const x of [-width / 2, width / 2]) {
      for (const y of [0, height]) {
        for (const z of [-depth / 2, depth / 2]) {
          const point = new Vector3(x, y, z).sub(target);
          const projectedX = point.dot(right);
          const projectedY = point.dot(up);
          minX = Math.min(minX, projectedX);
          maxX = Math.max(maxX, projectedX);
          minY = Math.min(minY, projectedY);
          maxY = Math.max(maxY, projectedY);
        }
      }
    }
    // Orthographic framing keeps parallel construction lines parallel. The
    // CSS surface excludes the control bar, so the whole model stays clear.
    camera.left = -size.width / 2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = -size.height / 2;
    fitZoom.current =
      Math.min(
        Math.max(1, size.width - 28) / Math.max(0.01, maxX - minX),
        Math.max(1, size.height - 24) / Math.max(0.01, maxY - minY),
      ) / 1.08;
    camera.zoom = fitZoom.current;
    camera.position.copy(target).addScaledVector(direction, 30);
    camera.near = 0.1;
    camera.far = 100;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.minZoom = fitZoom.current * 0.55;
      controlsRef.current.maxZoom = fitZoom.current * 5;
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
      camera.zoom = MathUtils.clamp(
        camera.zoom * (command.type === "zoom-in" ? 1.22 : 1 / 1.22),
        controls.minZoom,
        controls.maxZoom,
      );
      camera.updateProjectionMatrix();
      controls.update();
      invalidate();
      return;
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
      autoRotateSpeed={0.25}
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
  const gltf = useGLTF(modelUrl(model));
  const { invalidate } = useThree();
  const { scene, dimensions, offset, scale, materialCopies, edges } =
    useMemo(() => {
      const sceneCopy = gltf.scene.clone(true);
      const materialCopies = [];
      const edgeParts = { structure: [], facade: [] };
      sceneCopy.updateMatrixWorld(true);
      sceneCopy.traverse((object) => {
        if (!object.isMesh) return;
        const cloneMaterial = (original) => {
          const copy = original.clone();
          copy.polygonOffset = true;
          copy.polygonOffsetFactor = 1;
          copy.polygonOffsetUnits = 1;
          materialCopies.push(copy);
          return copy;
        };
        object.material = Array.isArray(object.material)
          ? object.material.map(cloneMaterial)
          : cloneMaterial(object.material);
        object.castShadow = false;
        object.receiveShadow = false;
        object.userData.initialVisibility = object.visible;
        if (object.visible && !/^Landscape/i.test(object.name)) {
          const edge = new EdgesGeometry(object.geometry, 30);
          edge.applyMatrix4(object.matrixWorld);
          edgeParts[/^Facade/i.test(object.name) ? "facade" : "structure"].push(
            edge,
          );
        }
      });
      const box = new Box3().setFromObject(sceneCopy);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const scalar = 10 / Math.max(size.x, size.y, size.z, 0.001);
      const edges = {};
      for (const category of ["structure", "facade"]) {
        const parts = edgeParts[category];
        edges[category] = parts.length ? mergeGeometries(parts, false) : null;
        parts.forEach((geometry) => geometry.dispose());
      }
      return {
        scene: sceneCopy,
        dimensions: [size.x * scalar, size.y * scalar, size.z * scalar],
        offset: [-center.x * scalar, -box.min.y * scalar, -center.z * scalar],
        scale: scalar,
        materialCopies,
        edges,
      };
    }, [gltf.scene]);

  useEffect(
    () => () => {
      materialCopies.forEach((material) => material.dispose());
      Object.values(edges).forEach((geometry) => geometry?.dispose());
    },
    [materialCopies, edges],
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
        {edges.structure && (
          <lineSegments
            geometry={edges.structure}
            renderOrder={2}
            dispose={null}
          >
            <lineBasicMaterial
              color="#56605a"
              transparent
              opacity={0.42}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
        )}
        {edges.facade && (
          <lineSegments
            geometry={edges.facade}
            visible={mode !== "structure"}
            renderOrder={2}
            dispose={null}
          >
            <lineBasicMaterial
              color="#69716f"
              transparent
              opacity={0.28}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
        )}
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
      data.lines = String(gl.info.render.lines);
      data.projection = camera.isOrthographicCamera
        ? "orthographic"
        : "perspective";
      data.zoom = camera.zoom.toFixed(3);
      data.azimuth = String(
        controlsRef.current?.getAzimuthalAngle().toFixed(3) || 0,
      );
      const cameraDistance = controlsRef.current
        ? camera.position.distanceTo(controlsRef.current.target)
        : 0;
      data.cameraDistance = cameraDistance.toFixed(3);
      data.distance = cameraDistance.toFixed(3);
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
        orthographic
        camera={{ position: [20, 20, 20], zoom: 40, near: 0.1, far: 100 }}
        gl={{
          antialias: !lowPower,
          alpha: false,
          powerPreference: "low-power",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 0.98,
        }}
        fallback={<span>Архитектурная концепция</span>}
      >
        <color attach="background" args={[PAPER]} />
        <ambientLight intensity={1.25} />
        <hemisphereLight
          color="#fffdf8"
          groundColor="#d0d0c8"
          intensity={0.55}
        />
        <directionalLight
          position={[8, 13, 7]}
          intensity={1.7}
          color="#fffdf8"
        />
        <directionalLight
          position={[-8, 6, -5]}
          intensity={0.55}
          color="#ebeeec"
        />
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
  useGLTF.clear(modelUrl(model));
}
