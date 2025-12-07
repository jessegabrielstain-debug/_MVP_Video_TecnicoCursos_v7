import { useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore';

export const useKeyboardShortcuts = () => {
    const isPlaying = useEditorStore((state) => state.isPlaying);
    const setIsPlaying = useEditorStore((state) => state.setIsPlaying);
    const elements = useEditorStore((state) => state.elements);
    const selectedId = useEditorStore((state) => state.selectedId);
    const removeElement = useEditorStore((state) => state.removeElement);
    const deleteSubtitle = useEditorStore((state) => state.deleteSubtitle);
    const subtitles = useEditorStore((state) => state.subtitles);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is input or textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    setIsPlaying(!isPlaying);
                    break;
                case 'Delete':
                case 'Backspace':
                    if (selectedId) {
                        // Check if it's a subtitle id or element id?
                        // Store should unify selection logic or we check both
                        // Currently selectElement only sets selectedId for canvas elements
                        removeElement(selectedId);
                        
                        // Also check subtitles?
                        // SubtitlesPanel manages selection internally or we need global selection for subs too
                    }
                    break;
                case 'Escape':
                    // Deselect?
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, setIsPlaying, selectedId, removeElement]);
};
