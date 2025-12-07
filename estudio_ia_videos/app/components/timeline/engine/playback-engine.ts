export class PlaybackEngine {
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private animationFrameId: number | null = null;
  private duration: number = 0;
  private fps: number = 30;
  
  private onTick: (time: number) => void;
  private onComplete: () => void;

  constructor(options: {
    onTick: (time: number) => void;
    onComplete: () => void;
    duration?: number;
    fps?: number;
  }) {
    this.onTick = options.onTick;
    this.onComplete = options.onComplete;
    this.duration = options.duration || 0;
    this.fps = options.fps || 30;
  }

  public play(currentTime: number) {
    if (this.isPlaying) return;

    this.isPlaying = true;
    // Calculate the "start time" relative to performance.now()
    // If we are at 5s, and now is 1000s, start time was at 995s.
    this.startTime = performance.now() - (currentTime * 1000);
    
    this.loop();
  }

  public pause() {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public toggle(currentTime: number) {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(currentTime);
    }
  }

  public setDuration(duration: number) {
    this.duration = duration;
  }

  public setFps(fps: number) {
    this.fps = fps;
  }

  private loop = () => {
    if (!this.isPlaying) return;

    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;

    if (elapsed >= this.duration) {
      this.pause();
      this.onTick(0); // Reset to start or keep at end? Usually reset or stop.
      this.onComplete();
      return;
    }

    this.onTick(elapsed);

    // Throttle to FPS if needed, but for smooth UI updates, usually we want 60fps 
    // even if video is 30fps. The renderer handles the frame picking.
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
