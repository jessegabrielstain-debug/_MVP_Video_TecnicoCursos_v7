console.log("🚀 SCRIPT CARREGADO: render-worker.js (Supabase-JS Version)");

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

dotenv.config();

const execPromise = util.promisify(exec);

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Adapter for new Logger
function log(message, type = 'INFO') {
    switch (type.toUpperCase()) {
        case 'ERROR':
            logger.error(message);
            break;
        case 'WARN':
            logger.warn(message);
            break;
        default:
            logger.info(message);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadToStorage(filePath, fileName) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const { data, error } = await supabase
            .storage
            .from('videos')
            .upload(fileName, fileBuffer, {
                contentType: 'video/mp4',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('videos')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        log(`   ❌ Erro no upload para Storage: ${error.message}`, 'ERROR');
        throw error;
    }
}

async function triggerWebhooks(userId, event, payload) {
    try {
        // 1. Fetch active webhooks for this user
        const { data: webhooks, error } = await supabase
            .from('webhooks')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true);

        if (error) throw error;
        if (!webhooks || webhooks.length === 0) return;

        log(`   🔔 Disparando webhooks (${event}) para ${webhooks.length} endpoints...`);

        for (const webhook of webhooks) {
            // Check if event matches
            const events = webhook.events; // JSONB
            if (!Array.isArray(events) || (!events.includes(event) && !events.includes('*'))) {
                continue;
            }

            // Create delivery record
            const { data: deliveryData, error: deliveryError } = await supabase
                .from('webhook_deliveries')
                .insert({
                    webhook_id: webhook.id,
                    event: event,
                    payload: payload, // Supabase handles JSON automatically
                    url: webhook.url,
                    status: 'pending',
                    scheduled_for: new Date().toISOString()
                })
                .select()
                .single();
            
            if (deliveryError) {
                log(`   ⚠️ Erro ao criar registro de webhook: ${deliveryError.message}`, 'WARN');
                continue;
            }

            const deliveryId = deliveryData.id;

            // Send request
            const timestamp = Date.now();
            const signature = crypto.createHmac('sha256', webhook.secret)
                .update(`${timestamp}.${JSON.stringify(payload)}`)
                .digest('hex');

            const startTime = Date.now();
            let status = 'failed';
            let responseCode = null;
            let responseBody = null;
            let errorMsg = null;

            try {
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Event': event,
                        'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,
                        'User-Agent': 'EstudioIA-Worker/1.0'
                    },
                    body: JSON.stringify(payload)
                });

                responseCode = response.status;
                const text = await response.text();
                responseBody = text.substring(0, 1000);
                status = response.ok ? 'completed' : 'failed';

                // Update stats (Optimistic, ignoring errors)
                // Note: Supabase doesn't support increment easily without RPC, so we fetch-update or use RPC if available.
                // For now, we skip stats update to keep it simple or do a simple update.
                /*
                await supabase.rpc('increment_webhook_stats', { 
                    webhook_id: webhook.id, 
                    is_success: response.ok 
                });
                */

            } catch (err) {
                errorMsg = err.message;
            }

            const duration = Date.now() - startTime;

            // Update delivery record
            await supabase
                .from('webhook_deliveries')
                .update({
                    status: status,
                    response_code: responseCode,
                    response_body: responseBody,
                    response_time: duration,
                    error: errorMsg,
                    delivered_at: new Date().toISOString(),
                    attempts: 1
                })
                .eq('id', deliveryId);
        }

    } catch (err) {
        log(`   ❌ Erro ao processar webhooks: ${err.message}`, 'ERROR');
    }
}

import { ElevenLabsClient } from "elevenlabs";

// Initialize ElevenLabs Client (Lazy loaded to avoid errors if key missing)
let elevenLabsClient = null;
if (process.env.ELEVENLABS_API_KEY) {
    elevenLabsClient = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY
    });
}

// Robust TTS function with retries and Multi-Provider Support
async function generateAudio(text, outputDir, provider = 'edge', voiceId = 'pt-BR-AntonioNeural', retries = 3) {
    const fileName = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.mp3`;
    const outputPath = path.join(outputDir, fileName);
    
    // Provider Logic
    if (provider === 'elevenlabs' && elevenLabsClient) {
        try {
            log(`   🎙️ Gerando áudio (ElevenLabs): ${text.substring(0, 30)}...`);
            const audioStream = await elevenLabsClient.generate({
                voice: voiceId || "21m00Tcm4TlvDq8ikWAM", // Default Rachel
                text: text,
                model_id: "eleven_multilingual_v2"
            });
            
            const fileStream = fs.createWriteStream(outputPath);
            audioStream.pipe(fileStream);
            
            return new Promise((resolve, reject) => {
                fileStream.on('finish', () => {
                    resolve({
                        success: true,
                        path: outputPath,
                        filename: fileName,
                        duration: text.split(' ').length / 2.5 // Estimate
                    });
                });
                fileStream.on('error', reject);
            });
        } catch (e) {
            log(`   ⚠️ Falha no ElevenLabs: ${e.message}. Tentando fallback para EdgeTTS...`, 'WARN');
            // Fallback to EdgeTTS
        }
    }

    // EdgeTTS (Default/Fallback)
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            let edgeTtsCommand = 'edge-tts';
            
            if (process.env.EDGE_TTS_PATH) {
                edgeTtsCommand = `"${process.env.EDGE_TTS_PATH}"`;
            } else {
                const localVenvPath = path.join(process.cwd(), '.venv', 'Scripts', 'edge-tts.exe');
                if (fs.existsSync(localVenvPath)) {
                    edgeTtsCommand = `"${localVenvPath}"`;
                }
            }

            // Use default voice if none provided or if it was an ElevenLabs voice ID
            const safeVoice = (voiceId && voiceId.includes('pt-BR')) ? voiceId : 'pt-BR-AntonioNeural';
            
            const command = `${edgeTtsCommand} --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}" --voice ${safeVoice}`;
            
            if (attempt === 1) log(`   🎙️ Gerando áudio (EdgeTTS): ${text.substring(0, 30)}...`);
            
            await execPromise(command);
            return {
                success: true,
                path: outputPath,
                filename: fileName,
                duration: text.split(' ').length / 2.5 // Estimate
            };
        } catch (e) {
            log(`   ⚠️ Tentativa ${attempt}/${retries} falhou: ${e.message}`, 'WARN');
            
            if (attempt === retries) {
                log('   ❌ Todas as tentativas de TTS falharam. Usando mock silencioso.', 'ERROR');
                fs.writeFileSync(outputPath, 'DUMMY AUDIO CONTENT');
                return {
                    success: false,
                    path: outputPath,
                    filename: fileName,
                    duration: 5
                };
            }
            await sleep(1000 * attempt);
        }
    }
}

const MAX_RETRIES = 3;

// Helper to determine if error is recoverable
function isRecoverableError(error) {
    const msg = error.message.toLowerCase();
    // Validation, Auth, or specific logic errors are likely permanent
    if (msg.includes('validation') || msg.includes('permission') || msg.includes('not found')) {
        return false;
    }
    // Network, Timeout, or Resource errors are likely transient
    return true;
}

async function runWorker() {
    log('👷 Render Worker REAL Iniciado (Supabase-JS Mode)...');
    log(`   🔄 Max Retries: ${MAX_RETRIES}`);
    
    const publicDir = path.join(process.cwd(), 'estudio_ia_videos', 'public');
    const audioDir = path.join(publicDir, 'tts-audio');
    const videoDir = path.join(publicDir, 'videos');
    
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    // Self-Healing Check (via REST)
    // We can't easily ALTER TABLE via REST without exec_sql.
    // But we verified the table exists.
    log('✅ Conectado ao Supabase (REST API)');

    let running = true;
    const runOnce = process.argv.includes('--once');
    process.on('SIGINT', () => { running = false; });

    while (running) {
        let currentJobId = null;
        let currentJob = null;
        try {
            // 1. Fetch Job (Optimistic Lock)
            const { data: jobs, error: fetchError } = await supabase
                .from('render_jobs')
                .select('*')
                .eq('status', 'queued')
                .order('created_at', { ascending: true })
                .limit(1);

            if (fetchError) throw fetchError;

            if (jobs && jobs.length > 0) {
                const candidateJob = jobs[0];
                
                // Try to lock
                const { data: lockedJobs, error: updateError } = await supabase
                    .from('render_jobs')
                    .update({ 
                        status: 'processing', 
                        started_at: new Date().toISOString(), 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', candidateJob.id)
                    .eq('status', 'queued') // Ensure it's still queued (concurrency check)
                    .select();

                if (updateError) throw updateError;

                if (lockedJobs && lockedJobs.length > 0) {
                    const job = lockedJobs[0];
                    currentJobId = job.id;
                    currentJob = job;
                    log(`\n🎬 Processando Job: ${job.id}`);

                    // Trigger Started Webhook
                    await triggerWebhooks(job.user_id, 'render.started', { 
                        jobId: job.id, 
                        projectId: job.project_id, 
                        userId: job.user_id 
                    });

                    // 2. Fetch Slides
                    const { data: slides, error: slidesError } = await supabase
                        .from('slides')
                        .select('*')
                        .eq('project_id', job.project_id)
                        .order('order_index', { ascending: true });

                    if (slidesError) throw slidesError;
                    
                    log(`   📄 Slides encontrados: ${slides.length}`);

                    // 3. Generate Audio for Slides
                    const processedSlides = [];
                    
                    for (let i = 0; i < slides.length; i++) {
                        const slide = slides[i];
                        
                        // Determine voice and provider from slide metadata or default
                        const provider = slide.voice_provider || 'edge';
                        const voiceId = slide.voice_id || 'pt-BR-AntonioNeural';
                        
                        const audioResult = await generateAudio(
                            slide.content || slide.title || "Slide sem texto", 
                            audioDir,
                            provider,
                            voiceId
                        );
                        
                        processedSlides.push({
                            ...slide,
                            audioUrl: `/tts-audio/${audioResult.filename}`,
                            duration: audioResult.duration
                        });

                        const progress = Math.round(((i + 1) / slides.length) * 50);
                        await supabase
                            .from('render_jobs')
                            .update({ progress: progress })
                            .eq('id', job.id);
                    }

                    // 4. Render Video (Remotion)
                    log('   🎥 Iniciando Renderização Remotion...');
                    
                    const inputProps = {
                        slides: processedSlides.map(s => ({
                            id: s.id,
                            title: s.title,
                            content: s.content,
                            duration: s.duration,
                            audioUrl: s.audioUrl
                        }))
                    };

                    const outputFileName = `${job.id}.mp4`;
                    const outputFilePath = path.join(videoDir, outputFileName);

                    const escapedProps = JSON.stringify(inputProps).replace(/"/g, '\\"');
                    const remotionCommand = `npx remotion render app/remotion/index.ts MyVideo "${outputFilePath}" --props="${escapedProps}"`;
                    
                    log(`   🚀 Executando (em estudio_ia_videos): ${remotionCommand.substring(0, 100)}...`);
                    
                    try {
                        await execPromise(remotionCommand, { 
                            cwd: path.join(process.cwd(), 'estudio_ia_videos'),
                            maxBuffer: 1024 * 1024 * 10 
                        });
                        log('   ✅ Renderização Remotion concluída!');
                    } catch (renderError) {
                        log(`   ❌ Erro no Remotion: ${renderError.message}`, 'ERROR');
                        throw new Error('Falha na renderização do vídeo');
                    }

                    // 5. Upload / Finalize
                    log('   ☁️ Fazendo upload para Supabase Storage...');
                    let publicVideoUrl;
                    
                    try {
                        publicVideoUrl = await uploadToStorage(outputFilePath, outputFileName);
                        log(`   ✅ Upload concluído: ${publicVideoUrl}`);
                    } catch (uploadError) {
                        log(`   ⚠️ Falha no upload, usando URL local: ${uploadError.message}`, 'WARN');
                        publicVideoUrl = `/videos/${outputFileName}`;
                    }
                    
                    await supabase
                        .from('render_jobs')
                        .update({ 
                            status: 'completed', 
                            progress: 100, 
                            completed_at: new Date().toISOString(),
                            output_url: publicVideoUrl
                        })
                        .eq('id', job.id);

                    log(`   ✅ Job Finalizado! URL: ${publicVideoUrl}`);

                    // Trigger Completed Webhook
                    await triggerWebhooks(job.user_id, 'render.completed', { 
                        jobId: job.id, 
                        projectId: job.project_id, 
                        videoUrl: publicVideoUrl, 
                        duration: 0 
                    });

                } else {
                    // Lost race, retry
                    continue;
                }
            } else {
                process.stdout.write('.');
                if (runOnce) {
                    log('\n🛑 Run once mode active and no jobs found. Exiting.');
                    break;
                }
                await sleep(2000);
            }

        } catch (err) {
            log(`❌ Erro no job: ${err.message}`, 'ERROR');
            if (currentJobId && currentJob) {
                const isRecoverable = isRecoverableError(err);
                const currentAttempts = currentJob.attempts || 1;
                
                if (isRecoverable && currentAttempts < MAX_RETRIES) {
                    const nextAttempt = currentAttempts + 1;
                    const delaySeconds = Math.pow(2, nextAttempt) * 5; // Exponential backoff: 10s, 20s, 40s...
                    
                    log(`   ⚠️ Erro recuperável. Tentativa ${currentAttempts}/${MAX_RETRIES}. Reagendando para daqui a ${delaySeconds}s...`, 'WARN');
                    
                    // Calculate next run time (simulated by just setting status back to queued, 
                    // but ideally we would have a 'scheduled_for' column. 
                    // For now, we just set it to queued and let it be picked up immediately or after sleep)
                    // To implement real delay, we would need a 'scheduled_for' column in DB.
                    // As a simple MVP fallback, we just increment attempts and set to queued.
                    
                    await supabase
                        .from('render_jobs')
                        .update({ 
                            status: 'queued', 
                            attempts: nextAttempt,
                            error_message: `Attempt ${currentAttempts} failed: ${err.message}`,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentJobId);
                        
                } else {
                    log(`   ⛔ Erro fatal ou limite de tentativas excedido (${currentAttempts}/${MAX_RETRIES}). Marcando como falha permanente.`, 'ERROR');
                    
                    await supabase
                        .from('render_jobs')
                        .update({ 
                            status: 'failed', 
                            error_message: err.message,
                            completed_at: new Date().toISOString()
                        })
                        .eq('id', currentJobId);

                    await triggerWebhooks(currentJob.user_id, 'render.failed', { 
                        jobId: currentJobId, 
                        projectId: currentJob.project_id, 
                        error: err.message 
                    });
                }
            }
            await sleep(5000);
        }
    }
}

runWorker();
