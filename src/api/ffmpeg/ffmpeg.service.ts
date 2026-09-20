import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

import { apiError } from '../../common/helpers/errors';

@Injectable()
export class FfmpegService {
    private readonly logger = new Logger(FfmpegService.name);

    async extractFirstFrame(video: Buffer): Promise<Buffer> {
        return this.withTempVideo(video, async (videoPath) => this.extractFrameAt(videoPath, 0));
    }

    async extractFrames(video: Buffer, count: number): Promise<Buffer[]> {
        if (!Number.isInteger(count) || count < 1) {
            throw apiError.badRequest('ffmpeg.invalid_frame_count');
        }

        return this.withTempVideo(video, async (videoPath) => {
            const durationSec = await this.getDurationSec(videoPath);
            const maxTimestampSec = Math.max(0, durationSec - 0.05);
            const positions = this.buildFramePositions(count);

            const frames: Buffer[] = [];
            for (const position of positions) {
                const timestampSec = Math.min(durationSec * position, maxTimestampSec);
                const frame = await this.extractFrameAt(videoPath, timestampSec);
                frames.push(frame);
            }

            return frames;
        });
    }

    private buildFramePositions(count: number): number[] {
        return Array.from({ length: count }, (_, index) => (index + 0.5) / count);
    }

    private async withTempVideo<T>(video: Buffer, fn: (videoPath: string) => Promise<T>): Promise<T> {
        const dir = await mkdtemp(join(tmpdir(), 'lifemem-ffmpeg'));
        const videoPath = join(dir, 'input');

        try {
            await writeFile(videoPath, video);
            return await fn(videoPath);
        } finally {
            await rm(dir, { recursive: true, force: true }).catch(() => undefined);
        }
    }

    private async getDurationSec(videoPath: string): Promise<number> {
        const ffprobePath = this.resolveFfprobePath();
        const { stdout } = await this.runProcess(ffprobePath, [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            videoPath
        ]);

        const durationSec = Number.parseFloat(stdout.toString('utf8').trim());
        if (!Number.isFinite(durationSec) || durationSec <= 0) {
            throw apiError.badRequest('ffmpeg.duration_unavailable');
        }

        return durationSec;
    }

    private async extractFrameAt(videoPath: string, timestampSec: number): Promise<Buffer> {
        const ffmpegPath = this.resolveFfmpegPath();
        const safeTimestamp = Math.max(0, timestampSec);

        const { stdout } = await this.runProcess(ffmpegPath, [
            '-hide_banner',
            '-loglevel',
            'error',
            '-ss',
            safeTimestamp.toFixed(3),
            '-i',
            videoPath,
            '-frames:v',
            '1',
            '-f',
            'image2pipe',
            '-vcodec',
            'mjpeg',
            'pipe:1'
        ]);

        if (stdout.length === 0) {
            this.logger.warn(`empty frame at ${safeTimestamp.toFixed(3)}s path=${videoPath}`);
            throw apiError.internal('ffmpeg.extract_failed');
        }

        return stdout;
    }

    private resolveFfmpegPath(): string {
        if (!ffmpegStatic) {
            throw apiError.internal('ffmpeg.binary_not_found');
        }

        return ffmpegStatic;
    }

    private resolveFfprobePath(): string {
        const path = ffprobeStatic?.path;
        if (!path) {
            throw apiError.internal('ffmpeg.binary_not_found');
        }

        return path;
    }

    private runProcess(command: string, args: string[]): Promise<{ stdout: Buffer; stderr: string }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];

            child.stdout.on('data', (chunk: Buffer) => {
                stdoutChunks.push(chunk);
            });

            child.stderr.on('data', (chunk: Buffer) => {
                stderrChunks.push(chunk);
            });

            child.on('error', (error) => {
                this.logger.error(`ffmpeg process error: ${error.message}`);
                reject(apiError.internal('ffmpeg.extract_failed'));
            });

            child.on('close', (code) => {
                const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
                if (code !== 0) {
                    this.logger.warn(`ffmpeg exit code=${code} stderr=${stderr}`);
                    reject(apiError.internal('ffmpeg.extract_failed'));
                    return;
                }

                resolve({
                    stdout: Buffer.concat(stdoutChunks),
                    stderr
                });
            });
        });
    }
}
