import TimelineEditor from '../../../app/lib/video/timeline-editor';

describe('TimelineEditor Continuous Flow', () => {
  test('snapClipsToBeat aligns clips to nearest beat', async () => {
    const editor = new TimelineEditor();
    const trackId = editor.addTrack('audio');
    await editor.addClip(trackId, { filePath: __filename, startTime: 0, endTime: 5, timelineStart: 0 });
    await editor.addClip(trackId, { filePath: __filename, startTime: 5, endTime: 10, timelineStart: 5.05 });
    editor.setContinuousFlow({ enabled: true, bpmSource: 'manual', bpmManual: 120, beatToleranceMs: 60, crossfadeRatio: 0.35 });
    editor.snapClipsToBeat(trackId);
    const t = editor.getTimeline();
    const a = t.tracks[0].clips[0];
    const b = t.tracks[0].clips[1];
    expect(Math.abs(a.timelineStart - 0)).toBeLessThan(0.05);
    const beatSec = 60 / 120;
    const nearestBeatB = Math.round(b.timelineStart / beatSec) * beatSec;
    expect(Math.abs(b.timelineStart - nearestBeatB)).toBeLessThan(0.06);
  });

  test('applyAdaptiveCrossfades sets transitions based on beat period', async () => {
    const editor = new TimelineEditor();
    const trackId = editor.addTrack('audio');
    await editor.addClip(trackId, { filePath: __filename, startTime: 0, endTime: 5, timelineStart: 0 });
    await editor.addClip(trackId, { filePath: __filename, startTime: 5, endTime: 10, timelineStart: 5 });
    editor.setContinuousFlow({ enabled: true, bpmSource: 'manual', bpmManual: 120, crossfadeRatio: 0.5 });
    editor.applyAdaptiveCrossfades(trackId);
    const t = editor.getTimeline();
    const b = t.tracks[0].clips[1];
    expect(b.transition).toBeDefined();
    const expected = (60_000 / 120) * 0.5 / 1000;
    expect(Math.abs((b.transition as any).duration - expected)).toBeLessThan(0.01);
  });
});
