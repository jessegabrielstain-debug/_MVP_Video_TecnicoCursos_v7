import { useState, useCallback } from 'react';

export interface ImportStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface ImportSlide {
  slideNumber: number;
  title: string;
  thumbnailUrl: string;
  duration: number;
  selected: boolean;
}

export interface ImportConfig {
  slideDuration: number;
  transition: string;
  addAudio: boolean;
}

export interface ImportResult {
  success: boolean;
  projectId?: string;
  clipsCreated?: number;
}

export function usePPTXImport() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  const [steps, setSteps] = useState<ImportStep[]>([
    { id: 1, title: 'Upload', description: 'Envie seu arquivo PPTX', status: 'active' },
    { id: 2, title: 'Análise', description: 'Processando slides', status: 'pending' },
    { id: 3, title: 'Configuração', description: 'Ajuste os detalhes', status: 'pending' },
    { id: 4, title: 'Conversão', description: 'Gerando timeline', status: 'pending' },
    { id: 5, title: 'Conclusão', description: 'Pronto para editar', status: 'pending' },
  ]);

  const [slides, setSlides] = useState<ImportSlide[]>([]);
  
  const [config, setConfig] = useState<ImportConfig>({
    slideDuration: 5,
    transition: 'fade',
    addAudio: false,
  });

  const updateStepStatus = (index: number, status: ImportStep['status']) => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, status } : step));
  };

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      updateStepStatus(prev, 'completed');
      updateStepStatus(next, 'active');
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev - 1;
      updateStepStatus(prev, 'pending');
      updateStepStatus(next, 'active');
      return next;
    });
  }, []);

  const uploadPPTX = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      // TODO: Implement real API call
      // const formData = new FormData();
      // formData.append('file', file);
      // const res = await fetch('/api/pptx/upload', { method: 'POST', body: formData });
      // const data = await res.json();
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepStatus(0, 'completed');
      updateStepStatus(1, 'active');
      setCurrentStep(1);
      
      return { id: 'mock-pptx-id-' + Date.now() };
    } catch (error) {
      updateStepStatus(0, 'error');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const analyzeSlides = useCallback(async (id: string) => {
    setIsProcessing(true);
    try {
      // TODO: Implement real API call to get slides
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock slides
      const mockSlides: ImportSlide[] = Array.from({ length: 5 }).map((_, i) => ({
        slideNumber: i + 1,
        title: `Slide ${i + 1}`,
        thumbnailUrl: '', // Placeholder
        duration: 5,
        selected: true,
      }));
      
      setSlides(mockSlides);
      
      updateStepStatus(1, 'completed');
      updateStepStatus(2, 'active');
      setCurrentStep(2);
    } catch (error) {
      updateStepStatus(1, 'error');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ImportConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const toggleSlideSelection = useCallback((slideNumber: number) => {
    setSlides(prev => prev.map(s => 
      s.slideNumber === slideNumber ? { ...s, selected: !s.selected } : s
    ));
  }, []);

  const updateSlideDuration = useCallback((slideNumber: number, duration: number) => {
    setSlides(prev => prev.map(s => 
      s.slideNumber === slideNumber ? { ...s, duration } : s
    ));
  }, []);

  const convertToTimeline = useCallback(async (pptxId: string, projectName: string) => {
    setIsProcessing(true);
    try {
      // TODO: Implement real API call to convert to timeline
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult({
        success: true,
        projectId: 'new-project-' + Date.now(),
        clipsCreated: slides.filter(s => s.selected).length
      });
      
      updateStepStatus(3, 'completed');
      updateStepStatus(4, 'active');
      setCurrentStep(4);
    } catch (error) {
      updateStepStatus(3, 'error');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [slides]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setSteps(prev => prev.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' : 'pending'
    })));
    setSlides([]);
    setResult(null);
    setConfig({
      slideDuration: 5,
      transition: 'fade',
      addAudio: false,
    });
  }, []);

  return {
    steps,
    currentStep,
    slides,
    config,
    isProcessing,
    result,
    nextStep,
    prevStep,
    uploadPPTX,
    analyzeSlides,
    updateConfig,
    toggleSlideSelection,
    updateSlideDuration,
    convertToTimeline,
    reset,
  };
}
