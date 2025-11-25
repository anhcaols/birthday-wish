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
  type?: 'message' | 'image' | 'heart';
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
  const heartModeRef = useRef(false);
  const heartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heartParticlesRef = useRef<any[]>([]);
  const heartAnimationIdRef = useRef<number | null>(null);

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
    // Ensure renderer is below heart canvas so images are visible
    (renderer.domElement as HTMLElement).style.position = 'absolute';
    (renderer.domElement as HTMLElement).style.zIndex = '1';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Mouse move event
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      targetCameraRef.current.x = mouseRef.current.x * 5;
      targetCameraRef.current.y = mouseRef.current.y * 5;
    };
    
    // Double click to toggle heart mode
    const handleDoubleClick = () => {
      heartModeRef.current = !heartModeRef.current;
      
      if (heartModeRef.current) {
        // Enter heart mode - hide messages, show heart animation
        // Images will still be visible (type !== 'message')
        initHeartAnimation();
        startHeartAnimation();
        console.log('💖 Heart mode activated');
      } else {
        // Exit heart mode
        if (heartAnimationIdRef.current) {
          cancelAnimationFrame(heartAnimationIdRef.current);
          heartAnimationIdRef.current = null;
        }
        if (heartCanvasRef.current) {
          heartCanvasRef.current.style.display = 'none';
        }
        console.log('✨ Normal mode activated');
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('dblclick', handleDoubleClick);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xFF3D6B, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF2D5C, 1, 100);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Initialize heart animation canvas (only create once)
    const initHeartAnimation = () => {
      if (heartCanvasRef.current) {
        heartCanvasRef.current.style.display = 'block';
        return;
      }

      const heartCanvas = document.createElement('canvas');
      heartCanvas.id = 'heartCanvas';
      heartCanvas.style.position = 'absolute';
      heartCanvas.style.left = '0';
      heartCanvas.style.top = '0';
      heartCanvas.style.width = '100%';
      heartCanvas.style.height = '100%';
      heartCanvas.style.pointerEvents = 'none';
      heartCanvas.style.zIndex = '10'; // Above Three.js renderer
      heartCanvas.style.backgroundColor = 'transparent'; // Don't block images
      
      containerRef.current?.appendChild(heartCanvas);
      heartCanvasRef.current = heartCanvas;
    };

    // Start heart animation (restart each time)
    const startHeartAnimation = () => {
      if (!heartCanvasRef.current) return;

      // Cancel existing animation if any
      if (heartAnimationIdRef.current) {
        cancelAnimationFrame(heartAnimationIdRef.current);
        heartAnimationIdRef.current = null;
      }

      const heartCanvas = heartCanvasRef.current;
      const ctx = heartCanvas.getContext('2d');
      if (!ctx) return;

      const width = heartCanvas.width = window.innerWidth;
      const height = heartCanvas.height = window.innerHeight;

      // Heart shape function
      const heartPosition = (rad: number): [number, number] => {
        return [
          Math.pow(Math.sin(rad), 3),
          -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
        ];
      };

      const scaleAndTranslate = (pos: [number, number], sx: number, sy: number, dx: number, dy: number): [number, number] => {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
      };

      // Create heart points
      const pointsOrigin: [number, number][] = [];
      const dr = 0.1;
      for (let i = 0; i < Math.PI * 2; i += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
      }
      for (let i = 0; i < Math.PI * 2; i += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
      }
      for (let i = 0; i < Math.PI * 2; i += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
      }

      const heartPointsCount = pointsOrigin.length;
      const targetPoints: [number, number][] = [];

      const pulse = (kx: number, ky: number) => {
        for (let i = 0; i < pointsOrigin.length; i++) {
          targetPoints[i] = [
            kx * pointsOrigin[i][0] + width / 2,
            ky * pointsOrigin[i][1] + height / 2
          ];
        }
      };

      // Reinitialize particles each time
      heartParticlesRef.current = [];
      for (let i = 0; i < heartPointsCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        heartParticlesRef.current[i] = {
          vx: 0,
          vy: 0,
          R: 2,
          speed: Math.random() + 5,
          q: Math.floor(Math.random() * heartPointsCount),
          D: 2 * (i % 2) - 1,
          force: 0.2 * Math.random() + 0.7,
          f: 'rgba(255, 107, 157, 1)',
          trace: Array(50).fill(null).map(() => ({ x, y }))
        };
      }

      let heartTime = 0;
      const animateHeart = () => {
        if (!heartModeRef.current) {
          heartAnimationIdRef.current = null;
          return;
        }

        const n = -Math.cos(heartTime);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        heartTime += (Math.sin(heartTime) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * 0.01;

        // Clear canvas with transparent background to show images behind
        ctx.clearRect(0, 0, width, height);

        for (let i = heartParticlesRef.current.length; i--;) {
          const u = heartParticlesRef.current[i];
          const q = targetPoints[u.q];
          const dx = u.trace[0].x - q[0];
          const dy = u.trace[0].y - q[1];
          const length = Math.sqrt(dx * dx + dy * dy);

          if (10 > length) {
            if (0.95 < Math.random()) {
              u.q = Math.floor(Math.random() * heartPointsCount);
            } else {
              if (0.99 < Math.random()) {
                u.D *= -1;
              }
              u.q += u.D;
              u.q %= heartPointsCount;
              if (0 > u.q) {
                u.q += heartPointsCount;
              }
            }
          }

          u.vx += (-dx / length) * u.speed;
          u.vy += (-dy / length) * u.speed;
          u.trace[0].x += u.vx;
          u.trace[0].y += u.vy;
          u.vx *= u.force;
          u.vy *= u.force;

          for (let k = 0; k < u.trace.length - 1; k++) {
            const T = u.trace[k];
            const N = u.trace[k + 1];
            N.x -= 0.4 * (N.x - T.x);
            N.y -= 0.4 * (N.y - T.y);
          }

          ctx.fillStyle = u.f;
          for (let k = 0; k < u.trace.length; k++) {
            ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
          }
        }

        // Draw text below heart
        ctx.save();
        ctx.font = 'italic bold 24px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Create gradient for text
        const gradient = ctx.createLinearGradient(width / 2 - 150, height / 2 + 150, width / 2 + 150, height / 2 + 150);
        gradient.addColorStop(0, '#FF3D6B');
        gradient.addColorStop(0.5, '#FF2D5C');
        gradient.addColorStop(1, '#FF3D6B');
        
        // Add glow effect
        ctx.shadowColor = '#FF2D5C';
        ctx.shadowBlur = 20;
        ctx.fillStyle = gradient;
        
        // Draw text below heart (heart center is at height/2, so text at height/2 + 250)
        ctx.fillText('Thanh Thuý 💝 - My love 05/12/2002 🎂', width / 2, height / 2 + 300);
        ctx.restore();

        heartAnimationIdRef.current = requestAnimationFrame(animateHeart);
      };

      animateHeart();
    };

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
      // Fixed font size at 72px for better readability
      context.font = `italic bold 48px Courier New, monospace `;
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
      // Fixed scale for consistent text size
      const scale = 3;
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
        type: 'message' as any, // Mark as message
      });
    });

    // Create floating images with fixed size and object-cover behavior
    const textureLoader = new THREE.TextureLoader();
    
    // Fixed dimensions for all images - increased for better visibility
    const fixedWidth = 6;  // Width in 3D units
    const fixedHeight = 6; // Height in 3D units
    const targetAspect = fixedWidth / fixedHeight; // Target aspect ratio
    const borderRadius = 12; // Border radius in pixels
    
    images.forEach((imageSrc, index) => {
      // Load image first
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Create canvas for rounded corners
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size (use high resolution for better quality)
        // Add padding for shadow effect
        const padding = 40;
        const canvasSize = 1024;
        canvas.width = canvasSize + padding * 2;
        canvas.height = canvasSize + padding * 2;
        
        const imgWidth = img.width;
        const imgHeight = img.height;
        const imgAspect = imgWidth / imgHeight;

        // Calculate scale and offset for object-cover effect
        let drawWidth = canvasSize;
        let drawHeight = canvasSize;
        let drawX = 0;
        let drawY = 0;

        if (imgAspect > targetAspect) {
          // Image is wider than target - scale and crop horizontally
          drawWidth = canvasSize * (imgAspect / targetAspect);
          drawX = (canvasSize - drawWidth) / 2;
        } else {
          // Image is taller than target - scale and crop vertically
          drawHeight = canvasSize * (targetAspect / imgAspect);
          drawY = (canvasSize - drawHeight) / 2;
        }

        // Scale border radius proportionally to canvas size
        // Border radius 12px on a typical 512px image = 24px on 1024px canvas
        const r = (borderRadius * canvasSize) / 512;
        const shadowBlur = 50; // White shadow blur
        
        // Draw white shadow/glow effect first (before clipping)
        ctx.save();
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw rounded rectangle path for shadow
        ctx.beginPath();
        ctx.moveTo(padding + r, padding);
        ctx.lineTo(padding + canvasSize - r, padding);
        ctx.quadraticCurveTo(padding + canvasSize, padding, padding + canvasSize, padding + r);
        ctx.lineTo(padding + canvasSize, padding + canvasSize - r);
        ctx.quadraticCurveTo(padding + canvasSize, padding + canvasSize, padding + canvasSize - r, padding + canvasSize);
        ctx.lineTo(padding + r, padding + canvasSize);
        ctx.quadraticCurveTo(padding, padding + canvasSize, padding, padding + canvasSize - r);
        ctx.lineTo(padding, padding + r);
        ctx.quadraticCurveTo(padding, padding, padding + r, padding);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        
        // Draw rounded rectangle path for clipping image
        ctx.beginPath();
        ctx.moveTo(padding + r, padding);
        ctx.lineTo(padding + canvasSize - r, padding);
        ctx.quadraticCurveTo(padding + canvasSize, padding, padding + canvasSize, padding + r);
        ctx.lineTo(padding + canvasSize, padding + canvasSize - r);
        ctx.quadraticCurveTo(padding + canvasSize, padding + canvasSize, padding + canvasSize - r, padding + canvasSize);
        ctx.lineTo(padding + r, padding + canvasSize);
        ctx.quadraticCurveTo(padding, padding + canvasSize, padding, padding + canvasSize - r);
        ctx.lineTo(padding, padding + r);
        ctx.quadraticCurveTo(padding, padding, padding + r, padding);
        ctx.closePath();
        ctx.clip();

        // Draw image with cover effect (adjusted for padding)
        ctx.drawImage(img, padding + drawX, padding + drawY, drawWidth, drawHeight);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 1,
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
            type: 'image' as any, // Mark as image
          });
      };
      
      img.onerror = (error) => {
        console.error(`❌ Error loading image ${imageSrc}:`, error);
      };
      
      img.src = imageSrc;
    });

    // Create hearts
    for (let i = 0; i < 100; i++) {
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
        type: 'heart' as any, // Mark as heart
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
        // In heart mode: hide messages, show images and hearts (all continue falling)
        // In normal mode: show everything
        if (heartModeRef.current) {
          obj.mesh.visible = obj.type !== 'message'; // Images and hearts visible
        } else {
          obj.mesh.visible = true; // All visible
        }

        // Continue animation for all objects (including images in heart mode)
        // Swing motion like snow
        const swingX = Math.sin(timeRef.current * obj.swingSpeed + obj.swingOffset) * 0.02;
        const swingZ = Math.cos(timeRef.current * obj.swingSpeed * 0.7 + obj.swingOffset) * 0.015;

        // Update position (images continue falling in heart mode)
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
      window.removeEventListener('dblclick', handleDoubleClick);
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
