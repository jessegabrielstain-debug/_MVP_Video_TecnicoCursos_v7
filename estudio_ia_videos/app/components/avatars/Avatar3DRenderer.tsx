
/**
 * 🎭 Avatar 3D Renderer Component
 * Renderização completa de avatares 3D com sincronização labial
 * Fase 1: Estrutura base e câmera ✅
 * Fase 2: Sincronização labial com TTS ✅
 * Fase 3: Integração com Timeline ✅
 * Fase 4: Persistência e testes ✅
 */

'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { logger } from '@/lib/logger';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  useGLTF, 
  Environment,
  ContactShadows,
  Html,
  Stage
} from '@react-three/drei';
import * as THREE from 'three';
import { useLipSync } from '@/hooks/useLipSync';
import { Avatar3DModel, AvatarClientHelper, LipSyncFrame } from '@/lib/avatar-client-logic';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Avatar3DRendererProps {
  avatarId: string;
  text?: string;
  audioUrl?: string;
  emotion?: string;
  emotionIntensity?: number;
  enableGestures?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  onAnimationComplete?: () => void;
  className?: string;
  externalAudio?: HTMLAudioElement | null;
}

interface LipSyncState {
  currentFrame: LipSyncFrame | null;
  isPlaying: boolean;
  duration: number;
  progress: number;
}

interface CameraControls {
  zoom: number;
  rotation: number;
}

/**
 * Componente do modelo 3D do avatar com animações
 */
function AvatarModel({ 
  avatar, 
  lipSyncFrame,
  isPlaying,
  emotion,
  emotionIntensity = 1.0,
  enableGestures = true
}: { 
  avatar: Avatar3DModel;
  lipSyncFrame: LipSyncFrame | null;
  isPlaying: boolean;
  emotion?: string;
  emotionIntensity?: number;
  enableGestures?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const [idleAnimation, setIdleAnimation] = useState({ breathPhase: 0, blinkTimer: 0 });

  // Carrega o modelo 3D (fallback para geometria simples se modelo não existir)
  const modelUrl = avatar.modelUrl;
  let scene: THREE.Group | null = null;
  
  try {
    // Tenta carregar o modelo GLTF
    const gltf = useGLTF(modelUrl as string, true) as any;
    scene = gltf.scene;
  } catch (error) {
    logger.warn('Modelo 3D não encontrado, usando fallback', { component: 'Avatar3DRenderer' });
  }

  // Animação idle e aplicação de blend shapes
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // FASE 1: Animação Idle (respiração e piscadas)
    if (!isPlaying) {
      // Respiração suave
      const breathSpeed = 1.5;
      idleAnimation.breathPhase += delta * breathSpeed;
      const breathIntensity = Math.sin(idleAnimation.breathPhase) * 0.02;
      
      // Movimento sutil do tronco
      meshRef.current.position.y = breathIntensity;
      
      // Piscadas aleatórias
      idleAnimation.blinkTimer += delta;
      if (idleAnimation.blinkTimer > 3 + Math.random() * 2) {
        // Piscar
        idleAnimation.blinkTimer = 0;
        // Aplicar blend shape de piscada
        if (meshRef.current.morphTargetInfluences) {
          const blinkLeftIndex = meshRef.current.morphTargetDictionary?.['eyeBlinkLeft'];
          const blinkRightIndex = meshRef.current.morphTargetDictionary?.['eyeBlinkRight'];
          
          if (blinkLeftIndex !== undefined) {
            meshRef.current.morphTargetInfluences[blinkLeftIndex] = 1.0;
            setTimeout(() => {
              if (meshRef.current?.morphTargetInfluences && blinkLeftIndex !== undefined) {
                meshRef.current.morphTargetInfluences[blinkLeftIndex] = 0.0;
              }
            }, 150);
          }
          
          if (blinkRightIndex !== undefined) {
            meshRef.current.morphTargetInfluences[blinkRightIndex] = 1.0;
            setTimeout(() => {
              if (meshRef.current?.morphTargetInfluences && blinkRightIndex !== undefined) {
                meshRef.current.morphTargetInfluences[blinkRightIndex] = 0.0;
              }
            }, 150);
          }
        }
      }
      
      setIdleAnimation({ ...idleAnimation });
    }

    // FASE 2: Sincronização Labial
    if (isPlaying && lipSyncFrame) {
      // Aplica blend shapes do lip sync com emoção
      AvatarClientHelper.applyBlendShapes(meshRef.current, lipSyncFrame, emotion, emotionIntensity);
      
      // Movimento sutil da cabeça durante a fala
      if (headRef.current) {
        const intensity = lipSyncFrame.intensity || 0;
        headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.02 * intensity;
        headRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 1.5) * 0.03 * intensity;
      }

      // FASE 4: Gestos Corporais (Se ativado)
      if (enableGestures && bodyRef.current && emotion) {
        const time = state.clock.elapsedTime;
        const baseIntensity = emotionIntensity;
        
        // Reset suave
        const targetRotX = 0;
        const targetRotY = 0;
        const targetRotZ = 0;
        const targetPosY = -0.2; // Posição base

        if (emotion === 'happy') {
          // Movimento mais solto e energético
          bodyRef.current.rotation.y = Math.sin(time * 2) * 0.05 * baseIntensity;
          bodyRef.current.position.y = -0.2 + Math.abs(Math.sin(time * 4)) * 0.02 * baseIntensity;
          if (headRef.current) headRef.current.rotation.z = Math.sin(time * 1.5) * 0.05 * baseIntensity;
        } 
        else if (emotion === 'angry') {
          // Tensão, movimentos rápidos e curtos
          bodyRef.current.rotation.x = 0.1 * baseIntensity; // Inclina para frente
          bodyRef.current.rotation.y = Math.sin(time * 8) * 0.02 * baseIntensity; // Tremor leve
        }
        else if (emotion === 'sad') {
          // Ombros caídos, movimento lento
          bodyRef.current.rotation.x = 0.15 * baseIntensity; // Curvado
          bodyRef.current.position.y = -0.22 * baseIntensity; // Mais baixo
          if (headRef.current) headRef.current.rotation.x = 0.2 * baseIntensity; // Cabeça baixa
        }
        else if (emotion === 'surprised') {
          // Recuo súbito (simulado com movimento lento aqui para suavidade)
          bodyRef.current.rotation.x = -0.1 * baseIntensity; // Inclina para trás
          bodyRef.current.position.y = -0.18 * baseIntensity; // Sobe um pouco
        }
        else if (emotion === 'fear') {
          // Encolhido, trêmulo
          bodyRef.current.scale.setScalar(1 - (0.05 * baseIntensity)); // Encolhe levemente
          bodyRef.current.rotation.y = Math.sin(time * 15) * 0.03 * baseIntensity; // Tremor rápido
        }
      }
    }
  });

  // Se temos um modelo GLTF, renderiza ele
  if (scene) {
    return (
      <primitive 
        ref={meshRef}
        object={scene} 
        scale={1.5}
        position={[0, -1, 0]}
      />
    );
  }

  // Fallback: Avatar simplificado usando geometrias básicas
  return (
    <group ref={headRef}>
      <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
        {/* Cabeça */}
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color={avatar.gender === 'female' ? '#f4c2c2' : '#d4a574'} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Corpo */}
      <mesh ref={bodyRef} position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.8, 16]} />
        <meshStandardMaterial 
          color={avatar.gender === 'male' ? '#2563eb' : '#ec4899'} 
        />
      </mesh>
      
      {/* Braços */}
      <mesh position={[-0.4, -0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial 
          color={avatar.gender === 'female' ? '#f4c2c2' : '#d4a574'} 
        />
      </mesh>
      <mesh position={[0.4, -0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial 
          color={avatar.gender === 'female' ? '#f4c2c2' : '#d4a574'} 
        />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.1, 0.55, 0.25]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 0.55, 0.25]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Boca - muda com lip sync */}
      <mesh position={[0, 0.4, 0.28]} scale={[1, lipSyncFrame?.intensity || 0.1, 1]}>
        <sphereGeometry args={[0.06, 16, 8]} />
        <meshStandardMaterial color="#8b0000" />
      </mesh>
    </group>
  );
}

/**
 * Componente de iluminação (3 pontos: key, fill, back)
 */
function Lighting() {
  return (
    <>
      {/* Key Light - Luz principal */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Fill Light - Luz de preenchimento */}
      <directionalLight
        position={[-3, 2, -5]}
        intensity={0.5}
      />
      
      {/* Back Light - Luz de contorno */}
      <directionalLight
        position={[0, 3, -5]}
        intensity={0.8}
      />
      
      {/* Ambient Light - Luz ambiente suave */}
      <ambientLight intensity={0.4} />
    </>
  );
}

/**
 * Componente de cena 3D completo
 */
function Scene({ 
  avatar, 
  lipSyncState,
  cameraControls,
  emotion,
  emotionIntensity,
  enableGestures
}: { 
  avatar: Avatar3DModel;
  lipSyncState: LipSyncState;
  cameraControls: CameraControls;
  emotion?: string;
  emotionIntensity?: number;
  enableGestures?: boolean;
}) {
  const controlsRef = useRef<any>();

  // Aplicar controles de câmera
  useEffect(() => {
    if (controlsRef.current) {
      if (cameraControls.zoom !== undefined) {
        controlsRef.current.object.zoom = cameraControls.zoom;
        controlsRef.current.object.updateProjectionMatrix();
      }
    }
  }, [cameraControls]);

  return (
    <>
      {/* Câmera com controles */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0.5, 3]}
        fov={50}
      />
      
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* Iluminação 3 pontos */}
      <Lighting />

      {/* Avatar 3D */}
      <Suspense fallback={null}>
        <AvatarModel 
          avatar={avatar} 
          lipSyncFrame={lipSyncState.currentFrame}
          isPlaying={lipSyncState.isPlaying}
          emotion={emotion}
          emotionIntensity={emotionIntensity}
          enableGestures={enableGestures}
        />
      </Suspense>

      {/* Sombras de contato */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
      />

      {/* Ambiente (HDR lighting) */}
      <Environment preset="city" />

      {/* Grid de chão */}
      <gridHelper args={[10, 10, '#666666', '#333333']} position={[0, -1, 0]} />
    </>
  );
}

/**
 * Componente principal Avatar3DRenderer
 */
export default function Avatar3DRenderer({
  avatarId,
  text = '',
  audioUrl = '',
  autoPlay = false,
  showControls = true,
  onAnimationComplete,
  className = '',
  externalAudio = null,
  emotion,
  emotionIntensity,
  enableGestures
}: Avatar3DRendererProps) {
  const [avatar, setAvatar] = useState<Avatar3DModel | null>(null);
  const [cameraControls, setCameraControls] = useState({ zoom: 1, rotation: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Hook de sincronização labial
  const { state: lipSyncState, play, pause, stop } = useLipSync({
    text,
    audioUrl,
    onComplete: onAnimationComplete,
    onError: (error) => logger.error('Erro no lip sync', error instanceof Error ? error : new Error(String(error)), { component: 'Avatar3DRenderer' }),
    externalAudio
  });

  // Carrega avatar
  useEffect(() => {
    const loadedAvatar = AvatarClientHelper.getAvatar(avatarId);
    if (loadedAvatar) {
      setAvatar(loadedAvatar);
      setIsLoading(false);
    } else {
      logger.error('Avatar não encontrado', new Error(`Avatar ID: ${avatarId}`), { component: 'Avatar3DRenderer', avatarId });
      setIsLoading(false);
    }
  }, [avatarId]);

  // Auto-play se configurado
  useEffect(() => {
    if (autoPlay && audioUrl && !isLoading && !externalAudio) {
      play();
    }
  }, [autoPlay, audioUrl, isLoading, play, externalAudio]);

  // Controles de câmera
  const handleZoomIn = () => {
    setCameraControls(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 3) }));
  };

  const handleZoomOut = () => {
    setCameraControls(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) }));
  };

  const handleReset = () => {
    setCameraControls({ zoom: 1, rotation: 0 });
    stop();
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Carregando avatar 3D...</p>
        </div>
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-red-600">
          <p>Avatar não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Canvas 3D */}
      <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg overflow-hidden">
        <Canvas
          shadows
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Scene
            avatar={avatar}
            lipSyncState={lipSyncState}
            cameraControls={cameraControls}
            emotion={emotion}
            emotionIntensity={emotionIntensity}
            enableGestures={enableGestures}
          />
        </Canvas>
      </div>

      {/* Controles de reprodução */}
      {showControls && (
        <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-white/90 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button
              size="sm"
              variant={lipSyncState.isPlaying ? "secondary" : "default"}
              onClick={lipSyncState.isPlaying ? pause : play}
              disabled={!audioUrl}
            >
              {lipSyncState.isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            {/* Reset */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Zoom */}
            <div className="flex items-center gap-1 border-l pl-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            {lipSyncState.duration > 0 && (
              <div className="flex items-center gap-2 border-l pl-3 min-w-[120px]">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-100"
                    style={{ width: `${lipSyncState.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {Math.round(lipSyncState.progress)}%
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Info do avatar */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-800">{avatar.name}</p>
        <p className="text-xs text-gray-600">
          Lip Sync: {avatar.lipSyncAccuracy}% • {avatar.ageRange} anos
        </p>
        {lipSyncState.currentFrame && (
          <p className="text-xs text-blue-600 mt-1">
            Phoneme: {lipSyncState.currentFrame.phoneme}
          </p>
        )}
      </div>

      {/* Instruções */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs text-gray-600 max-w-[200px]">
        <p className="font-semibold mb-1">Controles:</p>
        <p>• Botão direito: Rotacionar</p>
        <p>• Scroll: Zoom</p>
        <p>• Arrastar: Mover câmera</p>
      </div>
    </div>
  );
}
