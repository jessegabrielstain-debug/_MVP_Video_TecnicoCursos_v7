'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Text, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useEditorStore, CanvasElement } from '../stores/useEditorStore';

const KonvaStage = ({ stageRef }: { stageRef: React.RefObject<Konva.Stage> }) => {
    // const stageRef = useRef<Konva.Stage>(null); // Removed internal ref
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const elements = useEditorStore((state) => state.elements);
    const selectedId = useEditorStore((state) => state.selectedId);
    const selectElement = useEditorStore((state) => state.selectElement);
    const updateElement = useEditorStore((state) => state.updateElement);
    const addElement = useEditorStore((state) => state.addElement);

    const currentTime = useEditorStore((state) => state.currentTime);
    const isPlaying = useEditorStore((state) => state.isPlaying);
    const setCurrentTime = useEditorStore((state) => state.setCurrentTime);

    // Subtitles
    const subtitles = useEditorStore((state) => state.subtitles);
    const activeSubtitle = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);

    useEffect(() => {
        if (containerRef.current) {
            const { offsetWidth, offsetHeight } = containerRef.current;
            setDimensions({ width: offsetWidth, height: offsetHeight });
        }
        const handleResize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setDimensions({ width: offsetWidth, height: offsetHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectElement(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        stageRef.current?.setPointersPositions(e);
        const stagePos = stageRef.current?.getPointerPosition();
        if (!stagePos) return;

        const data = e.dataTransfer.getData('application/json');
        if (data) {
            const { type, src } = JSON.parse(data);
            let width = 100;
            let height = 100;
            if (type === 'video') { width = 320; height = 180; }
            if (type === 'text') { width = 200; height = 50; }

            addElement({
                id: `${type}-${Date.now()}`,
                type: type,
                x: stagePos.x - width / 2,
                y: stagePos.y - height / 2,
                width,
                height,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                zIndex: elements.length + 1,
                fill: type === 'shape' ? '#FF5733' : undefined,
                text: type === 'text' ? 'Double Click to Edit' : undefined,
                src: src
            });
        }
    };

    return (
        <div
            className="w-full h-full bg-gray-100"
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                ref={stageRef}
            >
                <Layer>
                    <Rect x={0} y={0} width={dimensions.width} height={dimensions.height} fill="#f0f0f0" listening={false} />

                    {elements.map((element) => {
                        return (
                            <CanvasItem
                                key={element.id}
                                element={element}
                                isSelected={selectedId === element.id}
                                onSelect={() => selectElement(element.id)}
                                onChange={(newAttrs) => updateElement(element.id, newAttrs)}
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                onTimeUpdate={(time) => setCurrentTime(time)}
                            />
                        );
                    })}

                    {/* Subtitles Overlay */}
                    {activeSubtitle && (
                        <Text
                            text={activeSubtitle.text}
                            fontSize={activeSubtitle.style?.fontSize || 24}
                            fontFamily={activeSubtitle.style?.fontFamily || 'Arial'}
                            fill={activeSubtitle.style?.fill || 'white'}
                            align={activeSubtitle.style?.align || 'center'}
                            width={dimensions.width - 100}
                            x={50}
                            y={dimensions.height - 100}
                            stroke="black"
                            strokeWidth={1} // Thinner stroke for clearer text
                            shadowColor="black"
                            shadowBlur={2}
                            shadowOpacity={0.8}
                            listening={false}
                        />
                    )}

                    <TransformerComponent selectedId={selectedId} />
                </Layer>
            </Stage>
        </div>
    );
};

const CanvasItem = ({
    element,
    isSelected,
    onSelect,
    onChange,
    currentTime,
    isPlaying,
    onTimeUpdate
}: {
    element: CanvasElement,
    isSelected: boolean,
    onSelect: () => void,
    onChange: (attrs: any) => void
    currentTime: number,
    isPlaying: boolean,
    onTimeUpdate: (time: number) => void
}) => {
    const shapeRef = useRef<Konva.Node>(null);

    const commonProps = {
        id: element.id,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        scaleX: element.scaleX,
        scaleY: element.scaleY,
        draggable: true,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
            onChange({
                x: e.target.x(),
                y: e.target.y(),
            });
        },
        onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
                x: node.x(),
                y: node.y(),
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(5, node.height() * scaleY),
                rotation: node.rotation()
            });
        }
    };

    const isVisible = currentTime >= element.startTime && currentTime <= (element.startTime + element.duration);

    if (element.type === 'video' && element.src) {
        return (
            <CanvasVideo
                element={element}
                commonProps={commonProps}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTimeUpdate={onTimeUpdate}
                isVisible={isVisible}
            />
        );
    }

    if (element.type === 'text') {
        if (!isVisible) return null;
        return (
            <Text
                ref={shapeRef as React.Ref<Konva.Text>}
                {...commonProps}
                text={element.text || 'Text'}
                fontSize={24}
                fill={element.fill || 'black'}
            />
        );
    }

    if (element.type === 'shape') {
        if (!isVisible) return null;
        return (
            <Rect
                ref={shapeRef as React.Ref<Konva.Rect>}
                {...commonProps}
                fill={element.fill || 'gray'}
            />
        );
    }

    return null;
};

const CanvasVideo = ({
    element,
    commonProps,
    currentTime,
    isPlaying,
    onTimeUpdate,
    isVisible
}: any) => {
    const imageRef = useRef<Konva.Image>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const registerVideoElement = useEditorStore(state => state.registerVideoElement);
    const unregisterVideoElement = useEditorStore(state => state.unregisterVideoElement);

    useEffect(() => {
        if (!element.src) return;
        const vid = document.createElement('video');
        vid.src = element.src;
        vid.crossOrigin = 'anonymous';
        vid.muted = false; // Must be false to capture audio, but we might mute the destination if not needed? No, user wants to hear.
        // Wait, if it's not in DOM, it might not play audio unless connected to context?
        // Actually, createElement('video') *does* play audio if you call play() even if offscreen.
        // We might want to mute it during editing IF we have a separate audio track preview? 
        // For now let's leave it unmuted so user can hear.
        setVideoElement(vid);

        registerVideoElement(element.id, vid);

        return () => {
            vid.pause();
            vid.src = '';
            vid.remove();
            unregisterVideoElement(element.id);
        }
    }, [element.src, element.id, registerVideoElement, unregisterVideoElement]);

    useEffect(() => {
        if (!videoElement) return;

        const relativeTime = (currentTime - element.startTime) / 1000;

        if (relativeTime >= 0 && relativeTime <= (element.duration / 1000)) {
            if (Math.abs(videoElement.currentTime - relativeTime) > 0.3) {
                videoElement.currentTime = relativeTime;
            }

            if (isPlaying) {
                videoElement.play().catch(e => { });
            } else {
                videoElement.pause();
            }
        } else {
            videoElement.pause();
        }

    }, [currentTime, isPlaying, element.startTime, element.duration, videoElement]);

    useEffect(() => {
        if (!videoElement || !imageRef.current) return;

        const anim = new Konva.Animation(() => {
            // Trigger draw
        }, imageRef.current.getLayer());

        if (isPlaying && isVisible) {
            anim.start();
        } else {
            anim.stop();
            imageRef.current.getLayer()?.batchDraw();
        }

        return () => {
            anim.stop();
        };
    }, [isPlaying, isVisible, videoElement]);

    if (!isVisible) return null;

    return (
        <React.Fragment>
            {videoElement && (
                <KonvaImage
                    ref={imageRef}
                    {...commonProps}
                    image={videoElement}
                />
            )}
        </React.Fragment>
    );
};

const TransformerComponent = ({ selectedId }: { selectedId: string | null }) => {
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (selectedId && trRef.current) {
            const stage = trRef.current.getStage();
            const selectedNode = stage?.findOne('#' + selectedId);
            if (selectedNode) {
                trRef.current.nodes([selectedNode]);
                trRef.current.getLayer()?.batchDraw();
            } else {
                trRef.current.nodes([]);
            }
        } else if (trRef.current) {
            trRef.current.nodes([]);
        }
    }, [selectedId]);

    return (
        <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            }}
        />
    );
}

export default KonvaStage;
