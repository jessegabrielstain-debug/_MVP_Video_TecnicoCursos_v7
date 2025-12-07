'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmExport: () => void;
    isExporting: boolean;
    progress: number;
}

const ExportModal = ({ open, onOpenChange, onConfirmExport, isExporting, progress }: ExportModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Video</DialogTitle>
                    <DialogDescription>
                        Render your video timeline to a WebM file. This captures the canvas in real-time.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {isExporting ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Rendering...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">Please do not close this window.</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <span className="text-sm font-medium">Format</span>
                                <span className="text-sm text-muted-foreground">WebM (VP9)</span>
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <span className="text-sm font-medium">Resolution</span>
                                <span className="text-sm text-muted-foreground">Original (Canvas)</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!isExporting && (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1"> Cancel </Button>
                            <Button onClick={onConfirmExport} className="flex-1" disabled={isExporting}>
                                <Download className="w-4 h-4 mr-2" />
                                Start Export
                            </Button>
                        </div>
                    )}
                    {isExporting && (
                        <Button disabled className="w-full">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rendering...
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExportModal;
