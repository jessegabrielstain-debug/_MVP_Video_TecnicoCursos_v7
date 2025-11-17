#!/usr/bin/env node
/**
 * Contract test: ensure no 'pending' status usage remains.
 */
import { readFileSync } from 'fs';
import path from 'path';

function fail(msg){
  console.error(`[contract] video-jobs-status: FAIL -> ${msg}`);process.exit(1);
}
function pass(){
  console.log('[contract] video-jobs-status: OK');
}

// 1. Check types definition
const dbTypesPath = path.join(process.cwd(),'lib','types','database.ts');
const dbTypes = readFileSync(dbTypesPath,'utf8');
if (/pending'/.test(dbTypes)) fail("'pending' encontrado em lib/types/database.ts");

// 2. Check API route for create
const routePath = path.join(process.cwd(),'estudio_ia_videos','app','api','v1','video-jobs','route.ts');
const routeSrc = readFileSync(routePath,'utf8');
if (/pending/.test(routeSrc)) fail("'pending' encontrado na rota de criação");
if (!/status:\s*'queued'/.test(routeSrc)) fail("Inserção não seta status 'queued'");

pass();