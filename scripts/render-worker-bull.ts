import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

const execPromise = util.promisify(exec);

// Types
interface RenderTaskPayload {
    projectId: string;
    userId: string;
    jobId: string;
    slides?: any[];
    config?: any;
}

interface RenderTaskResult {
    jobId: string;
    outputUrl: string;
    durationMs?: number;
}

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = process.env.RENDER_QUEUE_NAME || 'render-jobs';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    logger.error('❌ Missing Supabase credentials');
    process.exit(1);
}

// Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Helper Functions
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadToStorage(filePath: string, fileName: string) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const { error } = await supabase
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
    } catch (error: any) {
        logger.error(`❌ Upload error: ${error.message}`);
        throw error;
    }
}

async function generateAudio(text: string, outputDir: string, retries = 3) {
    const fileName = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.mp3`;
    const outputPath = path.join(outputDir, fileName);
    
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

            const command = `${edgeTtsCommand} --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}" --voice pt-BR-AntonioNeural`;
            await execPromise(command);
            
            return {
                success: true,
                path: outputPath,
                filename: fileName,
                duration: text.split(' ').length / 2.5 // Estimate
            };
        } catch (e: any) {
            if (attempt === retries) {
                logger.warn(`❌ TTS failed after ${retries} attempts. Using silent mock.`);
                fs.writeFileSync(outputPath, 'DUMMY AUDIO CONTENT');
                return { success: false, path: outputPath, filename: fileName, duration: 5 };
            }
            await sleep(1000 * attempt);
        }
    }
    throw new Error('TTS Generation failed');
}

async function triggerWebhooks(userId: string, event: string, payload: any) {
    try {
        const { data: webhooks } = await supabase
            .from('webhooks')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true);

        if (!webhooks?.length) return;

        for (const webhook of webhooks) {
            if (!Array.isArray(webhook.events) || (!webhook.events.includes(event) && !webhook.events.includes('*'))) {
                continue;
            }

            const timestamp = Date.now();
            const signature = crypto.createHmac('sha256', webhook.secret)
                .update(`${timestamp}.${JSON.stringify(payload)}`)
                .digest('hex');

            try {
                await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Event': event,
                        'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,
                        'User-Agent': 'EstudioIA-Worker/1.0'
                    },
                    body: JSON.stringify(payload)
                });
            } catch (e: any) {
                logger.warn(`Webhook failed: ${e.message}`);
            }
        }
    } catch (e: any) {
        logger.error(`Webhook trigger error: ${e.message}`);
    }
}

// Worker Processor
const processJob = async (job: Job<RenderTaskPayload, RenderTaskResult>) => {
    const { jobId, projectId, userId, slides: payloadSlides } = job.data;
    logger.info(`🎬 Processing Job ${jobId} (BullMQ)`);

    try {
        // 1. Update Status to Processing
        await supabase
            .from('render_jobs')
            .update({ 
                status: 'processing', 
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        await triggerWebhooks(userId, 'render.started', { jobId, projectId, userId });

        // 2. Fetch Slides (if not in payload)
        let slides = payloadSlides;
        if (!slides) {
            const { data: dbSlides, error } = await supabase
                .from('slides')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });
            
            if (error) throw error;
            slides = dbSlides;
        }

        // 3. Prepare Directories
        const publicDir = path.join(process.cwd(), 'estudio_ia_videos', 'public');
        const audioDir = path.join(publicDir, 'tts-audio');
        const videoDir = path.join(publicDir, 'videos');
        if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
        if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

        // 4. Generate Audio
        const processedSlides = [];
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const text = slide.content || slide.title || "Slide sem texto";
            const audioResult = await generateAudio(text, audioDir);
            
            processedSlides.push({
                ...slide,
                audioUrl: `/tts-audio/${audioResult.filename}`,
                duration: audioResult.duration
            });

            // Update Progress
            const progress = Math.round(((i + 1) / slides.length) * 50);
            await job.updateProgress(progress);
            await supabase.from('render_jobs').update({ progress }).eq('id', jobId);
        }

        // 5. Render Video (Remotion)
        logger.info('   🎥 Starting Remotion Render...');
        const inputProps = {
            slides: processedSlides.map(s => ({
                id: s.id,
                title: s.title,
                content: s.content,
                duration: s.duration,
                audioUrl: s.audioUrl
            }))
        };

        const outputFileName = `${jobId}.mp4`;
        const outputFilePath = path.join(videoDir, outputFileName);
        const escapedProps = JSON.stringify(inputProps).replace(/"/g, '\\"');
        
        // Execute Remotion
        const remotionCommand = `npx remotion render app/remotion/index.ts MyVideo "${outputFilePath}" --props="${escapedProps}"`;
        await execPromise(remotionCommand, { 
            cwd: path.join(process.cwd(), 'estudio_ia_videos'),
            maxBuffer: 1024 * 1024 * 10 
        });

        // 6. Upload
        logger.info('   ☁️ Uploading to Storage...');
        let publicVideoUrl;
        try {
            publicVideoUrl = await uploadToStorage(outputFilePath, outputFileName);
        } catch (e) {
            logger.warn('   ⚠️ Upload failed, using local URL');
            publicVideoUrl = `/videos/${outputFileName}`;
        }

        // 7. Complete
        await supabase
            .from('render_jobs')
            .update({ 
                status: 'completed', 
                progress: 100, 
                completed_at: new Date().toISOString(),
                output_url: publicVideoUrl
            })
            .eq('id', jobId);

        await triggerWebhooks(userId, 'render.completed', { jobId, projectId, videoUrl: publicVideoUrl });
        logger.info(`   ✅ Job ${jobId} Completed!`);

        return { jobId, outputUrl: publicVideoUrl };

    } catch (error: any) {
        logger.error(`❌ Job ${jobId} Failed: ${error.message}`);
        
        await supabase
            .from('render_jobs')
            .update({ 
                status: 'failed', 
                error_message: error.message,
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId);

        await triggerWebhooks(userId, 'render.failed', { jobId, projectId, error: error.message });
        throw error;
    }
};

// Start Worker
const worker = new Worker<RenderTaskPayload, RenderTaskResult>(QUEUE_NAME, processJob, {
    connection: {
        url: REDIS_URL,
        // TLS support for production Redis (e.g. Upstash)
        ...(REDIS_URL.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {})
    },
    concurrency: 1
});

worker.on('ready', () => logger.info(`🚀 BullMQ Worker Ready on queue: ${QUEUE_NAME}`));
worker.on('failed', (job, err) => logger.error(`Job ${job?.id} failed: ${err.message}`));
worker.on('error', err => logger.error(`Worker error: ${err.message}`));

// Graceful Shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down worker...');
    await worker.close();
    process.exit(0);
});
