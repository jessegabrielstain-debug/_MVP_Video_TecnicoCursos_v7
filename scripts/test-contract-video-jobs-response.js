#!/usr/bin/env node
/**
 * Contract test: ensure routes return standardized job object with settings.
 */
import { readFileSync } from 'fs';
import path from 'path';

function fail(msg){ console.error(`[contract] video-jobs-response: FAIL -> ${msg}`); process.exit(1); }
function pass(){ console.log('[contract] video-jobs-response: OK'); }

const base = path.join(process.cwd(),'estudio_ia_videos','app','api','v1','video-jobs');

// POST route
const postSrc = readFileSync(path.join(base,'route.ts'),'utf8');
if(!/return NextResponse.json\({ job, metrics:/.test(postSrc)) fail('POST não retorna job padronizado');
if(!/render_settings/.test(postSrc)) fail('POST não seleciona render_settings');
if(!/settings: \(data as any\)\.render_settings/.test(postSrc)) fail('POST não normaliza settings');

// cancel route
const cancelSrc = readFileSync(path.join(base,'cancel','route.ts'),'utf8');
if(!/select\('id,status,project_id,created_at,progress,render_settings,attempts,duration_ms'\)/.test(cancelSrc)) fail('Cancel não seleciona campos completos');
if(!/return NextResponse.json\({ job: jobResp \}/.test(cancelSrc)) fail('Cancel não retorna job padronizado');

// progress route
const progressSrc = readFileSync(path.join(base,'progress','route.ts'),'utf8');
if(!/select\('id,status,project_id,created_at,progress,render_settings,attempts,duration_ms'\)/.test(progressSrc)) fail('Progress não seleciona campos completos');
if(!/return NextResponse.json\({ job: jobResp \}/.test(progressSrc)) fail('Progress não retorna job padronizado');

// requeue route
const requeueSrc = readFileSync(path.join(base,'requeue','route.ts'),'utf8');
if(!/select\('id,status,project_id,created_at,progress,render_settings,attempts,duration_ms'\)/.test(requeueSrc)) fail('Requeue não seleciona campos completos');
if(!/return NextResponse.json\({ job: jobResp \}/.test(requeueSrc)) fail('Requeue não retorna job padronizado');

pass();