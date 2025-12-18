
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ParticleShape, GestureType } from '../types';

interface VisualizerProps {
  shape: ParticleShape;
  color1: string;
  color2: string;
  photoUrls: string[];
  onGestureDetected: (gesture: GestureType) => void;
}

declare const Hands: any;
declare const Camera: any;

const Visualizer: React.FC<VisualizerProps> = ({ shape, color1, color2, photoUrls, onGestureDetected }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const stateRef = useRef({
    targetScale: 1.0,
    targetZ: 25,
    targetRotationSpeed: 0.002,
    currentScale: 1.0,
    currentZ: 25,
    currentRotationSpeed: 0.002,
    lastGesture: 'NONE' as GestureType,
    activePhotoIdx: -1,
  });

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    geometry: THREE.BufferGeometry;
    photos: THREE.Group;
    decorations: THREE.Group;
    ribbons: THREE.Group;
    starGroup: THREE.Group;
    clock: THREE.Clock;
    targetPositions: Float32Array;
  } | null>(null);

  const PARTICLE_COUNT = 15000;
  const PHOTO_COUNT = 8;
  const DECORATION_COUNT = 50;
  const PHOTO_SIZE = 3.5;

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 1. Particle System
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      sizes[i] = Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 2. Tree Top Star
    const starGroup = new THREE.Group();
    const starShape = new THREE.Shape();
    const starPoints = 5;
    const innerRadius = 0.4;
    const outerRadius = 1.0;
    for (let i = 0; i < starPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (starPoints * 2)) * Math.PI * 2;
      if (i === 0) starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1 });
    const starMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      emissive: 0xcccccc, 
      emissiveIntensity: 2,
      metalness: 1,
      roughness: 0.1
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starGroup.add(starMesh);
    const starLight = new THREE.PointLight(0xaaaaff, 5, 15);
    starGroup.add(starLight);
    starGroup.position.y = 10.5;
    scene.add(starGroup);

    // 3. Decorations
    const decorationGroup = new THREE.Group();
    const treeH = 20, treeR = 8;
    for (let i = 0; i < DECORATION_COUNT; i++) {
      const type = i % 3;
      let decMesh;
      if (type === 0) {
        const ballColors = [0x00BFFF, 0x0000FF, 0xFF00FF, 0x8800FF, 0xE0E0E0];
        const chosenColor = ballColors[Math.floor(Math.random() * ballColors.length)];
        decMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshStandardMaterial({ color: chosenColor, emissive: chosenColor, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.1 })
        );
      } else if (type === 1) {
        decMesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.25, 0.5, 12),
          new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.8, roughness: 0.2 })
        );
      } else {
        decMesh = new THREE.Mesh(
          new THREE.CircleGeometry(0.5, 6),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
        );
      }
      const py = Math.random() * (treeH * 0.9);
      const angle = Math.random() * Math.PI * 2;
      const radiusAtHeight = treeR * (1 - py / treeH);
      decMesh.position.set(Math.cos(angle) * (radiusAtHeight + 0.2), py - treeH / 2, Math.sin(angle) * (radiusAtHeight + 0.2));
      decorationGroup.add(decMesh);
    }
    scene.add(decorationGroup);

    // 4. Ribbons
    const ribbonGroup = new THREE.Group();
    const ribbonCount = 4; 
    for (let rIdx = 0; rIdx < ribbonCount; rIdx++) {
      const curvePoints = [];
      const turns = 3 + Math.random() * 2;
      const pointsPerTurn = 40;
      const totalPoints = Math.floor(turns * pointsPerTurn);
      for (let i = 0; i <= totalPoints; i++) {
        const t = i / totalPoints;
        const py = t * (treeH * 1.0);
        const angle = t * Math.PI * 2 * turns + (rIdx * (Math.PI * 2 / ribbonCount));
        const baseRadius = treeR * (1 - py / treeH) + 0.3;
        const noise = Math.sin(t * 10) * 0.2;
        curvePoints.push(new THREE.Vector3(Math.cos(angle) * (baseRadius + noise), py - treeH / 2, Math.sin(angle) * (baseRadius + noise)));
      }
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, totalPoints, 0.12, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, emissive: 0x90A4AE, emissiveIntensity: 15.0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
      const ribbon = new THREE.Mesh(tubeGeo, tubeMat);
      (ribbon as any).phaseOffset = Math.random() * Math.PI * 2;
      (ribbon as any).floatSpeed = 0.5 + Math.random() * 0.5;
      ribbonGroup.add(ribbon);
    }
    scene.add(ribbonGroup);

    // 5. Photo Wall
    const photoGroup = new THREE.Group();
    for (let i = 0; i < PHOTO_COUNT; i++) {
      const photoMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(PHOTO_SIZE, PHOTO_SIZE),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      // Subtle White Frame
      const frameGeo = new THREE.PlaneGeometry(PHOTO_SIZE + 0.2, PHOTO_SIZE + 0.2);
      const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.z = -0.01;
      photoMesh.add(frame);
      
      const py = (i / PHOTO_COUNT) * (treeH * 0.7) + 2; 
      const angle = (i / PHOTO_COUNT) * Math.PI * 2; 
      const radiusAtHeight = treeR * (1 - py / treeH);
      photoMesh.position.set(Math.cos(angle) * (radiusAtHeight + 0.8), py - treeH / 2, Math.sin(angle) * (radiusAtHeight + 0.8));
      photoMesh.lookAt(0, photoMesh.position.y, 0);
      (photoMesh as any).originalPos = photoMesh.position.clone();
      (photoMesh as any).originalQuat = photoMesh.quaternion.clone();
      photoGroup.add(photoMesh);
    }
    scene.add(photoGroup);

    scene.add(new THREE.AmbientLight(0x404040, 2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const clock = new THREE.Clock();
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    sceneRef.current = { 
      scene, camera, renderer, particles, geometry, 
      photos: photoGroup, decorations: decorationGroup, ribbons: ribbonGroup,
      starGroup, clock, targetPositions 
    };

    const animate = () => {
      if (!sceneRef.current) return;
      const { scene, camera, renderer, particles, geometry, photos, decorations, ribbons, starGroup, clock, targetPositions } = sceneRef.current;
      const state = stateRef.current;
      const time = clock.getElapsedTime();

      state.currentScale = THREE.MathUtils.lerp(state.currentScale, state.targetScale, 0.1);
      state.currentZ = THREE.MathUtils.lerp(state.currentZ, state.targetZ, 0.08);
      state.currentRotationSpeed = THREE.MathUtils.lerp(state.currentRotationSpeed, state.targetRotationSpeed, 0.05);

      particles.scale.setScalar(state.currentScale);
      decorations.scale.setScalar(state.currentScale);
      ribbons.scale.setScalar(state.currentScale);
      starGroup.scale.setScalar(state.currentScale);
      starGroup.position.y = 10.5 * state.currentScale;

      camera.position.z = state.currentZ;
      particles.rotation.y += state.currentRotationSpeed;
      decorations.rotation.y += state.currentRotationSpeed;
      ribbons.rotation.y += state.currentRotationSpeed * 1.5;
      ribbons.children.forEach((child: any) => {
        child.position.y = Math.sin(time * child.floatSpeed + child.phaseOffset) * 0.3;
        const s = 1.0 + Math.sin(time * 0.8 + child.phaseOffset) * 0.05;
        child.scale.set(s, 1.0, s);
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 12.0 + Math.sin(time * 2.0 + child.phaseOffset) * 3.0;
        }
      });
      starGroup.rotation.y += 0.02;
      const starMesh = starGroup.children[0] as THREE.Mesh;
      if (starMesh && starMesh.material instanceof THREE.MeshStandardMaterial) {
        starMesh.material.emissiveIntensity = 2 + Math.sin(time * 3) * 0.5;
      }

      const currentPositions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        currentPositions[i] += (targetPositions[i] - currentPositions[i]) * 0.06;
      }
      geometry.attributes.position.needsUpdate = true;

      photos.rotation.y -= state.currentRotationSpeed * 1.0; 
      photos.children.forEach((photo: any, idx) => {
        const isTarget = state.activePhotoIdx === idx && state.lastGesture === 'PINCH';
        if (isTarget) {
            const camQuat = new THREE.Quaternion();
            camera.getWorldQuaternion(camQuat);
            const camPos = new THREE.Vector3();
            camera.getWorldPosition(camPos);
            const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat);
            const targetWorldPos = camPos.clone().add(camDir.multiplyScalar(10));
            const targetLocalPos = photo.parent.worldToLocal(targetWorldPos);
            photo.position.lerp(targetLocalPos, 0.15);
            const parentWorldQuat = new THREE.Quaternion();
            photo.parent.getWorldQuaternion(parentWorldQuat);
            const targetLocalQuat = parentWorldQuat.invert().multiply(camQuat);
            photo.quaternion.slerp(targetLocalQuat, 0.15);
            photo.scale.setScalar(THREE.MathUtils.lerp(photo.scale.x, 3.5, 0.15));
        } else {
            photo.position.lerp(photo.originalPos, 0.1);
            photo.quaternion.slerp(photo.originalQuat, 0.1);
            photo.scale.setScalar(THREE.MathUtils.lerp(photo.scale.x, 1.0, 0.15));
        }
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  // Update Photos Effect
  useEffect(() => {
    if (!sceneRef.current || photoUrls.length === 0) return;
    const { photos } = sceneRef.current;
    const textureLoader = new THREE.TextureLoader();
    photos.children.forEach((photo: any, i: number) => {
      const url = photoUrls[i % photoUrls.length];
      textureLoader.load(url, (tex) => {
        if (photo.material instanceof THREE.MeshBasicMaterial) {
          photo.material.map = tex;
          photo.material.needsUpdate = true;
        }
      });
    });
  }, [photoUrls]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const targets = sceneRef.current.targetPositions;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      let x = 0, y = 0, z = 0;
      switch (shape) {
        case ParticleShape.CONE:
          const h = 20, r = 8, py = Math.random() * h, angle = Math.random() * Math.PI * 2;
          const radiusAtHeight = r * (1 - py / h);
          x = radiusAtHeight * Math.cos(angle); y = py - h / 2; z = radiusAtHeight * Math.sin(angle);
          break;
        case ParticleShape.HEART:
          const t = Math.random() * Math.PI * 2;
          x = 16 * Math.pow(Math.sin(t), 3); y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          z = (Math.random() - 0.5) * 5; x *= 0.5; y *= 0.5;
          break;
        case ParticleShape.STAR:
          const starAngle = Math.random() * Math.PI * 2, armCount = 5;
          const starR = 10 * (0.5 + 0.5 * (Math.abs(Math.cos(starAngle * armCount / 2))));
          x = starR * Math.cos(starAngle); y = starR * Math.sin(starAngle); z = (Math.random() - 0.5) * 2;
          break;
        case ParticleShape.SNOWFLAKE:
          const sfAngle = Math.random() * Math.PI * 2, sfArm = 6;
          const sfR = 10 * (0.3 + 0.7 * Math.pow(Math.abs(Math.sin(sfAngle * sfArm / 2)), 0.5));
          x = sfR * Math.cos(sfAngle); y = sfR * Math.sin(sfAngle); z = (Math.random() - 0.5) * 3;
          break;
        case ParticleShape.FIREWORKS:
          const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1), fR = 12 * Math.pow(Math.random(), 0.3);
          x = fR * Math.sin(phi) * Math.cos(theta); y = fR * Math.sin(phi) * Math.sin(theta); z = fR * Math.cos(phi);
          break;
      }
      targets[idx] = x; targets[idx + 1] = y; targets[idx + 2] = z;
    }
  }, [shape]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { geometry } = sceneRef.current;
    const colors = geometry.attributes.color.array as Float32Array;
    const c1 = new THREE.Color(color1), c2 = new THREE.Color(color2);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const col = new THREE.Color().lerpColors(c1, c2, Math.random());
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    geometry.attributes.color.needsUpdate = true;
  }, [color1, color2]);

  useEffect(() => {
    if (typeof Hands === 'undefined') return;
    const hands = new Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    hands.onResults((results: any) => {
      const state = stateRef.current;
      const scene = sceneRef.current;
      if (!scene) return;
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const thumbTip = landmarks[4], indexTip = landmarks[8];
        const pinchDist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
        const palm = landmarks[0];
        const fingerIndices = [8, 12, 16, 20];
        const avgFingerDist = fingerIndices.reduce((sum, idx) => sum + Math.sqrt(Math.pow(landmarks[idx].x - palm.x, 2) + Math.pow(landmarks[idx].y - palm.y, 2)), 0) / 4;
        let currentGesture: GestureType = 'NONE';
        if (pinchDist < 0.04) {
          currentGesture = 'PINCH';
          if (state.lastGesture !== 'PINCH') {
            let minDistance = Infinity, closestIdx = -1;
            scene.photos.children.forEach((photo, idx) => {
              const worldPos = new THREE.Vector3(); photo.getWorldPosition(worldPos);
              const distToCam = worldPos.distanceTo(scene.camera.position);
              if (distToCam < minDistance) { minDistance = distToCam; closestIdx = idx; }
            });
            state.activePhotoIdx = closestIdx;
          }
          state.targetZ = 16;
        } else if (avgFingerDist < 0.12) {
          currentGesture = 'FIST'; state.targetScale = 0.4; state.targetZ = 25;
        } else if (avgFingerDist > 0.4) {
          currentGesture = 'OPEN'; state.targetScale = 1.8; state.targetZ = 25;
        } else {
          currentGesture = 'ROTATION';
          const xOffset = landmarks[9].x - 0.5;
          state.targetRotationSpeed = 0.002 + xOffset * 0.15; state.targetScale = 1.0; state.targetZ = 25;
        }
        if (state.lastGesture !== currentGesture) { onGestureDetected(currentGesture); state.lastGesture = currentGesture; }
      } else {
        state.targetScale = 1.0; state.targetZ = 25; state.targetRotationSpeed = 0.002;
        if (state.lastGesture !== 'NONE') { onGestureDetected('NONE'); state.lastGesture = 'NONE'; }
      }
    });
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, { onFrame: async () => { await hands.send({ image: videoRef.current! }); }, width: 640, height: 480 });
      camera.start();
    }
  }, [onGestureDetected]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <video ref={videoRef} className="hidden" />
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none select-none">
        <h1 className="text-3xl md:text-4xl font-serif font-bold italic tracking-tighter"
            style={{
              color: '#f0f0f0',
              textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(100,100,255,0.4)',
              background: 'linear-gradient(to bottom, #ffffff 0%, #a0a0a0 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))'
            }}>
          Merry Christmas
        </h1>
        <div className="mt-2 h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-silver-400 to-transparent opacity-50" 
             style={{ background: 'linear-gradient(90deg, transparent, silver, transparent)' }} />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />
    </div>
  );
};

export default Visualizer;
