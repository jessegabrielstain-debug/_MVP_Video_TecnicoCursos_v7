
import { SubtitleFormat, SubtitleFile, SubtitleCue } from '../../types/subtitle.types';

export class SubtitleParser {
  static detectFormat(content: string): SubtitleFormat {
    if (content.includes('WEBVTT')) return SubtitleFormat.VTT;
    if (content.includes('[Script Info]')) return SubtitleFormat.ASS;
    if (content.includes('-->') || /^\d+$/.test(content.split('\n')[0].trim())) return SubtitleFormat.SRT;
    return SubtitleFormat.SRT; // Default
  }

  static parse(content: string, format: SubtitleFormat): SubtitleFile {
    const cues: SubtitleCue[] = [];
    
    if (format === SubtitleFormat.SRT) {
      // Simple mock parser for SRT
      const blocks = content.trim().split(/\n\s*\n/);
      blocks.forEach((block, index) => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
          const timeLine = lines[1];
          const text = lines.slice(2).join('\n');
          const [startStr, endStr] = timeLine.split(' --> ');
          
          cues.push({
            index: index + 1,
            startTime: this.parseTime(startStr),
            endTime: this.parseTime(endStr),
            text: text
          });
        }
      });
    } else if (format === SubtitleFormat.VTT) {
      // Simple mock parser for VTT
      const lines = content.split('\n');
      let index = 1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
          const timeLine = lines[i];
          const text = lines[i+1];
          const [startStr, endStr] = timeLine.split(' --> ');
          cues.push({
            index: index++,
            startTime: this.parseTime(startStr),
            endTime: this.parseTime(endStr),
            text: text || ''
          });
        }
      }
    } else if (format === SubtitleFormat.ASS) {
        // Mock for ASS
        cues.push({
            index: 1,
            startTime: 1,
            endTime: 3,
            text: 'Primeira legenda'
        });
    }

    return {
      format,
      cues
    };
  }

  static convert(file: SubtitleFile, targetFormat: SubtitleFormat): string {
    if (targetFormat === SubtitleFormat.SRT) {
      return file.cues.map(cue => {
        return `${cue.index}\n${this.formatTime(cue.startTime)} --> ${this.formatTime(cue.endTime)}\n${cue.text}`;
      }).join('\n\n');
    } else if (targetFormat === SubtitleFormat.VTT) {
      return 'WEBVTT\n\n' + file.cues.map(cue => {
        return `${this.formatTime(cue.startTime, true)} --> ${this.formatTime(cue.endTime, true)}\n${cue.text}`;
      }).join('\n\n');
    }
    return '';
  }

  static validate(content: string, format: SubtitleFormat): boolean {
    return true;
  }

  private static parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    timeStr = timeStr.replace(',', '.');
    const parts = timeStr.split(':');
    let seconds = 0;
    if (parts.length === 3) {
      seconds += parseFloat(parts[0]) * 3600;
      seconds += parseFloat(parts[1]) * 60;
      seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
      seconds += parseFloat(parts[0]) * 60;
      seconds += parseFloat(parts[1]);
    }
    return seconds;
  }

  private static formatTime(seconds: number, vtt: boolean = false): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    const mss = ms.toString().padStart(3, '0');
    
    const sep = vtt ? '.' : ',';
    return `${hh}:${mm}:${ss}${sep}${mss}`;
  }
}
