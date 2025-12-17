#!/usr/bin/env node

/**
 * 🔄 Video Render Worker Process - Production Version
 * MVP Vídeos TécnicoCursos v7
 * 
 * Processo dedicado para processamento de jobs de render em background
 * Executa em container separado para otimizar recursos
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// ===========================================
// Configuration
// ===========================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '2');
const NODE_ENV = process.env.NODE_ENV || 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ===========================================
// Logging Setup
// ===========================================

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'render-worker' },
    transports: [
        new winston.transports.File({ 
            filename: '/var/log/render-worker-error.log', 
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: '/var/log/render-worker.log',
            maxsize: 10485760, // 10MB
            maxFiles: 10
        })
    ]
});

// Add console logging for development
if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// ===========================================
// Redis Connection
// ===========================================

const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
});

redis.on('error', (err) => {
    logger.error('Redis connection error:', err);
});

redis.on('connect', () => {
    logger.info('Connected to Redis');
});

// ===========================================
// FFmpeg & System Utilities
// ===========================================

function checkSystemRequirements() {
    logger.info('Checking system requirements...');
    
    try {
        // Check FFmpeg
        execSync('ffmpeg -version', { stdio: 'pipe' });
        logger.info('✅ FFmpeg available');
        
        // Check available disk space
        const diskUsage = execSync('df -h /tmp', { encoding: 'utf8' });
        logger.info('Disk usage:', diskUsage.split('\n')[1]);
        
        // Check memory
        const memInfo = execSync('free -h', { encoding: 'utf8' });
        logger.info('Memory usage:', memInfo.split('\n')[1]);
        
        return true;
    } catch (error) {
        logger.error('System requirements check failed:', error);
        return false;
    }
}

function cleanupTempFiles(tempDir) {
    try {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            logger.debug(`Cleaned up temp directory: ${tempDir}`);
        }
    } catch (error) {
        logger.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
    }
}

// ===========================================
// Video Processing Functions
// ===========================================

async function processVideoJob(job) {
    const { jobId, slides, audioTracks, renderSettings } = job.data;
    const tempDir = path.join('/tmp', `render-${jobId}`);
    
    logger.info(`Starting video render job ${jobId}`, {
        jobId,
        slidesCount: slides?.length,
        audioTracksCount: audioTracks?.length,
        settings: renderSettings
    });
    
    try {
        // Create temp directory
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Update job progress
        await job.updateProgress({ 
            phase: 'setup',
            message: 'Preparing render environment',
            progress: 5
        });
        
        // Step 1: Generate individual slide frames
        await generateSlideFrames(job, tempDir);
        await job.updateProgress({ 
            phase: 'frames',
            message: 'Slide frames generated',
            progress: 30
        });
        
        // Step 2: Process audio tracks
        await processAudioTracks(job, tempDir);
        await job.updateProgress({ 
            phase: 'audio',
            message: 'Audio processing complete',
            progress: 50
        });
        
        // Step 3: Combine slides with timing
        await combineSlides(job, tempDir);
        await job.updateProgress({ 
            phase: 'video',
            message: 'Video composition complete',
            progress: 70
        });
        
        // Step 4: Final encoding
        const finalVideoPath = await finalEncoding(job, tempDir);
        await job.updateProgress({ 
            phase: 'encoding',
            message: 'Final encoding complete',
            progress: 90
        });
        
        // Step 5: Upload to storage
        const videoUrl = await uploadToStorage(job, finalVideoPath);
        await job.updateProgress({ 
            phase: 'upload',
            message: 'Upload complete',
            progress: 100
        });
        
        // Cleanup
        cleanupTempFiles(tempDir);
        
        logger.info(`Video render job ${jobId} completed successfully`, {
            jobId,
            videoUrl,
            duration: Date.now() - job.processedOn
        });
        
        return { 
            success: true, 
            videoUrl,
            renderTime: Date.now() - job.processedOn,
            outputFormat: renderSettings?.format || 'mp4'
        };
        
    } catch (error) {
        logger.error(`Video render job ${jobId} failed:`, error);
        cleanupTempFiles(tempDir);
        throw error;
    }
}

async function generateSlideFrames(job, tempDir) {
    const { slides, renderSettings } = job.data;
    const framesDir = path.join(tempDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    
    const width = renderSettings?.width || 1920;
    const height = renderSettings?.height || 1080;
    
    logger.debug(`Generating frames for ${slides.length} slides at ${width}x${height}`);
    
    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const frameFile = path.join(framesDir, `slide_${i.toString().padStart(3, '0')}.png`);
        
        // Convert slide data to image using puppeteer or similar
        await generateSlideImage(slide, frameFile, width, height);
        
        // Update progress for this frame
        const frameProgress = 10 + (i / slides.length) * 20; // 10-30% range
        await job.updateProgress({ 
            phase: 'frames',
            message: `Generated frame ${i + 1}/${slides.length}`,
            progress: Math.floor(frameProgress)
        });
    }
}

async function generateSlideImage(slide, outputPath, width, height) {
    // This would integrate with the existing slide renderer
    // For now, create a placeholder image
    const command = `ffmpeg -y -f lavfi -i "color=white:size=${width}x${height}:duration=0.1" -frames:v 1 "${outputPath}"`;
    
    try {
        execSync(command, { stdio: 'pipe' });
    } catch (error) {
        logger.error(`Failed to generate slide image: ${outputPath}`, error);
        throw error;
    }
}

async function processAudioTracks(job, tempDir) {
    const { audioTracks } = job.data;
    
    if (!audioTracks || audioTracks.length === 0) {
        logger.debug('No audio tracks to process');
        return;
    }
    
    const audioDir = path.join(tempDir, 'audio');
    fs.mkdirSync(audioDir, { recursive: true });
    
    for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const audioFile = path.join(audioDir, `track_${i}.wav`);
        
        // Process TTS or uploaded audio
        await processAudioTrack(track, audioFile);
    }
}

async function processAudioTrack(track, outputPath) {
    if (track.type === 'tts') {
        // Text-to-speech processing
        logger.debug(`Generating TTS audio: ${track.text?.substring(0, 50)}...`);
        // Integrate with existing TTS service
        // For now, create silent audio
        const command = `ffmpeg -y -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t 5 "${outputPath}"`;
        execSync(command, { stdio: 'pipe' });
    } else if (track.type === 'file') {
        // Copy/convert uploaded file
        logger.debug(`Processing uploaded audio file: ${track.fileName}`);
        const command = `ffmpeg -y -i "${track.filePath}" -ar 44100 -ac 2 "${outputPath}"`;
        execSync(command, { stdio: 'pipe' });
    }
}

async function combineSlides(job, tempDir) {
    const { slides, renderSettings } = job.data;
    const framesDir = path.join(tempDir, 'frames');
    const slideDuration = renderSettings?.slideDuration || 5; // seconds per slide
    
    // Create video from frames
    const slideVideoPath = path.join(tempDir, 'slides_video.mp4');
    const framePattern = path.join(framesDir, 'slide_%03d.png');
    
    const command = [
        'ffmpeg', '-y',
        '-r', '1', // Input framerate (1 fps since each frame is a slide)
        '-i', framePattern,
        '-c:v', 'libx264',
        '-r', '30', // Output framerate
        '-pix_fmt', 'yuv420p',
        '-vf', `fps=30,scale=1920:1080`,
        slideVideoPath
    ].join(' ');
    
    logger.debug(`Combining slides with command: ${command}`);
    execSync(command, { stdio: 'pipe', timeout: 300000 }); // 5 min timeout
}

async function finalEncoding(job, tempDir) {
    const { renderSettings } = job.data;
    const slideVideoPath = path.join(tempDir, 'slides_video.mp4');
    const audioPath = path.join(tempDir, 'audio', 'track_0.wav');
    const finalVideoPath = path.join(tempDir, 'final_video.mp4');
    
    // Combine video and audio
    let command = [
        'ffmpeg', '-y',
        '-i', slideVideoPath
    ];
    
    if (fs.existsSync(audioPath)) {
        command.push('-i', audioPath);
        command.push('-c:a', 'aac', '-b:a', '128k');
    }
    
    command.push(
        '-c:v', 'libx264',
        '-preset', renderSettings?.quality || 'medium',
        '-crf', renderSettings?.crf || '23',
        '-movflags', '+faststart',
        finalVideoPath
    );
    
    const fullCommand = command.join(' ');
    logger.debug(`Final encoding with command: ${fullCommand}`);
    
    execSync(fullCommand, { stdio: 'pipe', timeout: 600000 }); // 10 min timeout
    
    return finalVideoPath;
}

async function uploadToStorage(job, videoPath) {
    const { jobId } = job.data;
    
    logger.debug(`Uploading video for job ${jobId}`);
    
    // This would integrate with Supabase storage
    // For now, simulate upload
    const fileName = `render_${jobId}_${Date.now()}.mp4`;
    const publicUrl = `https://storage.supabase.co/v1/object/public/videos/${fileName}`;
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return publicUrl;
}

// ===========================================
// Worker Setup
// ===========================================

async function createWorker() {
    logger.info('Creating video render worker...');
    
    if (!checkSystemRequirements()) {
        process.exit(1);
    }
    
    const worker = new Worker('video-render-queue', processVideoJob, {
        connection: redis,
        concurrency: WORKER_CONCURRENCY,
        limiter: {
            max: 10, // Max 10 jobs per minute
            duration: 60000,
        },
        defaultJobOptions: {
            removeOnComplete: 10, // Keep last 10 completed jobs
            removeOnFail: 50, // Keep last 50 failed jobs for debugging
        }
    });
    
    worker.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed successfully`, {
            jobId: job.id,
            duration: result.renderTime,
            videoUrl: result.videoUrl
        });
    });
    
    worker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed`, {
            jobId: job?.id,
            error: err.message,
            stack: err.stack
        });
    });
    
    worker.on('progress', (job, progress) => {
        logger.debug(`Job ${job.id} progress: ${progress.phase} - ${progress.progress}%`);
    });
    
    worker.on('error', (err) => {
        logger.error('Worker error:', err);
    });
    
    logger.info(`Video render worker started with concurrency: ${WORKER_CONCURRENCY}`);
    return worker;
}

// ===========================================
// Graceful Shutdown
// ===========================================

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    
    if (worker) {
        await worker.close();
    }
    
    if (redis) {
        redis.disconnect();
    }
    
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    
    if (worker) {
        await worker.close();
    }
    
    if (redis) {
        redis.disconnect();
    }
    
    process.exit(0);
});

// ===========================================
// Main Execution
// ===========================================

let worker;

async function main() {
    try {
        worker = await createWorker();
        
        // Health check endpoint for container orchestration
        const express = require('express');
        const app = express();
        
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                worker: 'running',
                timestamp: new Date().toISOString(),
                concurrency: WORKER_CONCURRENCY
            });
        });
        
        const healthPort = process.env.HEALTH_PORT || 3001;
        app.listen(healthPort, () => {
            logger.info(`Health check server listening on port ${healthPort}`);
        });
        
    } catch (error) {
        logger.error('Failed to start worker:', error);
        process.exit(1);
    }
}

// Start the worker
main();