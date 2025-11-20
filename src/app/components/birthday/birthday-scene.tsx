'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Message {
  text: string;
  size?: number;
}

interface BirthdaySceneProps {
  messages: Message[];
  images: string[];
}

interface FallingObject {
  mesh: THREE.Sprite;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  baseVelocity: THREE.Vector3;
  swingOffset: number;
  swingSpeed: number;
}

export default function BirthdayScene({ messages, images }: BirthdaySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const fallingObjectsRef = useRef<FallingObject[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetCameraRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double initialization
    if (sceneRef.current) {
      return;
    }


    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 35);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Mouse move event
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      targetCameraRef.current.x = mouseRef.current.x * 5;
      targetCameraRef.current.y = mouseRef.current.y * 5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xFF3D6B, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF2D5C, 1, 100);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Create stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1500;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create messages
    messages.forEach((message) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = 1024;
      canvas.height = 256;

      // Draw text
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#FF3D6B');
      gradient.addColorStop(0.5, '#FF2D5C');
      gradient.addColorStop(1, '#FF3D6B');

      context.shadowColor = '#FF2D5C';
      context.shadowBlur = 20;
      context.fillStyle = gradient;
      context.font = `italic bold ${message.size || 48}px "Brush Script MT", cursive`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(message.text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.85,
      });

      const sprite = new THREE.Sprite(material);
      const scale = (message.size || 48) / 20;
      sprite.scale.set(scale * 8, scale * 2, 1);

      sprite.position.set(
        (Math.random() - 0.5) * 70,
        Math.random() * 90 + 10,
        (Math.random() - 0.5) * 50
      );

      scene.add(sprite);

      const baseVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        -0.08 - Math.random() * 0.06,
        (Math.random() - 0.5) * 0.01
      );

      fallingObjectsRef.current.push({
        mesh: sprite,
        velocity: baseVelocity.clone(),
        baseVelocity: baseVelocity.clone(),
        rotation: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.01
        ),
        swingOffset: Math.random() * Math.PI * 2,
        swingSpeed: 0.5 + Math.random() * 0.5,
      });
    });

    // Create floating images with fixed size and object-cover behavior
    const textureLoader = new THREE.TextureLoader();
    
    // Fixed dimensions for all images
    const fixedWidth = 6;  // Width in 3D units
    const fixedHeight = 8; // Height in 3D units
    const targetAspect = fixedWidth / fixedHeight; // Target aspect ratio
    
    images.forEach((imageSrc, index) => {
      textureLoader.load(
        imageSrc,
        (texture) => {
          // Get original image dimensions
          const imgWidth = texture.image.width;
          const imgHeight = texture.image.height;
          const imgAspect = imgWidth / imgHeight;

          // Calculate scale and offset for object-cover effect
          let scale = { x: 1, y: 1 };
          let offset = { x: 0, y: 0 };

          if (imgAspect > targetAspect) {
            // Image is wider than target - scale and crop horizontally
            scale.x = targetAspect / imgAspect;
            offset.x = (1 - scale.x) / 2;
          } else {
            // Image is taller than target - scale and crop vertically
            scale.y = imgAspect / targetAspect;
            offset.y = (1 - scale.y) / 2;
          }

          // Apply texture transformations for cover effect
          texture.repeat.set(scale.x, scale.y);
          texture.offset.set(offset.x, offset.y);
          texture.center.set(0.5, 0.5);

          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
          });

          const sprite = new THREE.Sprite(material);
          
          // Apply fixed dimensions
          sprite.scale.set(fixedWidth, fixedHeight, 1);

          // Random starting position
          sprite.position.set(
            (Math.random() - 0.5) * 70,
            Math.random() * 90 + 10,
            (Math.random() - 0.5) * 50
          );

          scene.add(sprite);

          const baseVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.012,
            -0.06 - Math.random() * 0.04,
            (Math.random() - 0.5) * 0.012
          );

          fallingObjectsRef.current.push({
            mesh: sprite,
            velocity: baseVelocity.clone(),
            baseVelocity: baseVelocity.clone(),
            rotation: new THREE.Vector3(
              (Math.random() - 0.5) * 0.006,
              (Math.random() - 0.5) * 0.006,
              (Math.random() - 0.5) * 0.012
            ),
            swingOffset: Math.random() * Math.PI * 2,
            swingSpeed: 0.4 + Math.random() * 0.4,
          });

        },
        undefined,
        (error) => {
          console.error(`❌ Error loading image ${imageSrc}:`, error);
        }
      );
    });

    // Create hearts
    for (let i = 0; i < 40; i++) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = 128;
      canvas.height = 128;

      context.shadowColor = '#FF2D5C';
      context.shadowBlur = 15;
      context.fillStyle = '#FF3D6B';
      context.beginPath();
      const x = 64;
      const y = 64;
      const width = 40;
      const height = 40;

      context.moveTo(x, y + height / 4);
      context.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + height / 4);
      context.bezierCurveTo(x - width / 2, y + height / 2, x, y + (height * 3) / 4, x, y + height);
      context.bezierCurveTo(x, y + (height * 3) / 4, x + width / 2, y + height / 2, x + width / 2, y + height / 4);
      context.bezierCurveTo(x + width / 2, y, x, y, x, y + height / 4);
      context.fill();

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.75,
      });

      const sprite = new THREE.Sprite(material);
      const scale = 1.2 + Math.random() * 0.8;
      sprite.scale.set(scale, scale, 1);

      sprite.position.set(
        (Math.random() - 0.5) * 70,
        Math.random() * 90 + 10,
        (Math.random() - 0.5) * 50
      );

      scene.add(sprite);

      const baseVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.008,
        -0.05 - Math.random() * 0.05,
        (Math.random() - 0.5) * 0.008
      );

      fallingObjectsRef.current.push({
        mesh: sprite,
        velocity: baseVelocity.clone(),
        baseVelocity: baseVelocity.clone(),
        rotation: new THREE.Vector3(0, 0, (Math.random() - 0.5) * 0.02),
        swingOffset: Math.random() * Math.PI * 2,
        swingSpeed: 0.4 + Math.random() * 0.6,
      });
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      // Camera follows mouse smoothly
      camera.position.x += (targetCameraRef.current.x - camera.position.x) * 0.05;
      camera.position.y += (targetCameraRef.current.y - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Wind effect from mouse
      const windX = mouseRef.current.x * 0.05;
      const windZ = mouseRef.current.y * 0.03;

      // Update all falling objects
      fallingObjectsRef.current.forEach((obj) => {
        // Swing motion like snow
        const swingX = Math.sin(timeRef.current * obj.swingSpeed + obj.swingOffset) * 0.02;
        const swingZ = Math.cos(timeRef.current * obj.swingSpeed * 0.7 + obj.swingOffset) * 0.015;

        // Update position
        obj.mesh.position.x += obj.baseVelocity.x + swingX + windX;
        obj.mesh.position.y += obj.baseVelocity.y;
        obj.mesh.position.z += obj.baseVelocity.z + swingZ + windZ;

        // Rotation
        obj.mesh.rotation.x += obj.rotation.x;
        obj.mesh.rotation.y += obj.rotation.y;
        obj.mesh.rotation.z += obj.rotation.z;

        // Reset when out of bounds
        if (obj.mesh.position.y < -45) {
          obj.mesh.position.y = 45 + Math.random() * 10;
          obj.mesh.position.x = (Math.random() - 0.5) * 70;
          obj.mesh.position.z = (Math.random() - 0.5) * 50;
        }

        // Keep within horizontal bounds
        if (Math.abs(obj.mesh.position.x) > 40) {
          obj.mesh.position.x = Math.sign(obj.mesh.position.x) * 40;
        }
        if (Math.abs(obj.mesh.position.z) > 30) {
          obj.mesh.position.z = Math.sign(obj.mesh.position.z) * 30;
        }
      });

      // Rotate stars slowly
      stars.rotation.y += 0.0002;

      renderer.render(scene, camera);
    };

    animate();

    // Window resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }

      // Dispose resources
      if (sceneRef.current) {
        starsGeometry.dispose();
        starsMaterial.dispose();

        fallingObjectsRef.current.forEach((obj) => {
          if (obj.mesh.material.map) {
            obj.mesh.material.map.dispose();
          }
          obj.mesh.material.dispose();
        });

        fallingObjectsRef.current = [];
        sceneRef.current.clear();
        sceneRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
    };
  }, [messages, images]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full"
      style={{ 
        background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
        touchAction: 'none'
      }}
    />
  );
}
