import { useEffect, useRef } from 'hono/jsx/dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ToolpathSegment } from '../types';

type ToolpathPreview3DProps = {
  segments: ToolpathSegment[];
};

export const ToolpathPreview3D = ({ segments }: ToolpathPreview3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    const container = containerRef.current;

    if (segments.length === 0) {
      container.innerHTML = '';
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || Math.floor(width * 0.75);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height, false);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1, 2, 1.5);
    scene.add(light);

    const grid = new THREE.GridHelper(200, 20, 0x2563eb, 0x1f2937);
    scene.add(grid);
    scene.add(new THREE.AxesHelper(100));

    const rapidPoints: number[] = [];
    const cutPoints: number[] = [];
    const bounds = new THREE.Box3();

    segments.forEach(({ start, end, rapid }) => {
      const pointStore = rapid ? rapidPoints : cutPoints;
      pointStore.push(...start, ...end);
      bounds.expandByPoint(new THREE.Vector3(...start));
      bounds.expandByPoint(new THREE.Vector3(...end));
    });

    if (cutPoints.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(cutPoints, 3));
      const lines = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xf97316 })
      );
      scene.add(lines);
    }

    if (rapidPoints.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(rapidPoints, 3));
      const lines = new THREE.LineSegments(
        geometry,
        new THREE.LineDashedMaterial({ color: 0x22d3ee, dashSize: 3, gapSize: 1.5 })
      );
      lines.computeLineDistances();
      scene.add(lines);
    }

    const size = bounds.getSize(new THREE.Vector3());
    const pivot = new THREE.Vector3(
      bounds.isEmpty() ? 0 : (bounds.min.x + bounds.max.x) / 2,
      bounds.isEmpty() ? 0 : (bounds.min.y + bounds.max.y) / 2,
      bounds.isEmpty() || !Number.isFinite(bounds.min.z) ? 0 : bounds.min.z
    );

    const horizontalSpan = Math.max(size.x, size.y, 1);
    const verticalSpan = Math.max(size.z, 1);
    const radius = Math.max(horizontalSpan * 1.25, verticalSpan * 2, 60);

    camera.position.set(
      pivot.x + radius,
      pivot.y - radius * 0.8,
      pivot.z + radius * 0.6 + verticalSpan * 0.5
    );
    camera.near = Math.max(radius / 200, 0.1);
    camera.far = radius * 200;
    camera.updateProjectionMatrix();

    controls.target.copy(
      new THREE.Vector3(pivot.x, pivot.y, pivot.z + verticalSpan * 0.3)
    );
    controls.update();

    let animationId = 0;
    const renderLoop = () => {
      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    const handleResize = () => {
      const newWidth = container.clientWidth || width;
      const newHeight = container.clientHeight || height;
      renderer.setSize(newWidth, newHeight, false);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleResize)
      : null;

    resizeObserver?.observe(container);

    if (!resizeObserver) {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener('resize', handleResize);
      }
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [segments]);

  return (
    <div
      ref={containerRef}
      class="relative w-full rounded-lg border border-gray-800 bg-gray-900 overflow-hidden"
      style={{ aspectRatio: '4 / 3', minHeight: '24rem' }}
    >
      {segments.length === 0 && (
        <div class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          3Dプレビューを生成できません
        </div>
      )}
    </div>
  );
};
