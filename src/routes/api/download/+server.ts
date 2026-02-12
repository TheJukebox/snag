import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';

interface FormatMetadata {
  asr: string,
  filesize: number,
  format_id: string,
  format_note: string,
  source_preference: number,
  fps: number,
  audio_channels: number,
  height: number,
  quality: number,
  has_drm: boolean,
  tbr: number,
  filesize_approx: number,
  width: number,
  language: string,
  language_preference: number,
  preference: number,
  ext: string,
  vcodec: string,
  acodec: string,
  dynamic_range: string,
  container: string,
  url: string,
  available_at: number,
  downloader_options: Record<string, unknown>,
  protocol: string,
  video_ext: string,
  audio_ext: string,
  abr: number,
  vbr: number,
  resolution: string,
  aspect_ration: number,
  http_headers: Record<string, unknown>,
  format: string,
}

const execFileAsync = promisify(execFile);

export async function POST({ request, getClientAddress }) {
  const signal = request.signal;

  try {
    const { url, format } = await request.json();
    const client: string = request.headers.get('x-forwarded-for')?.split(',')[0] || getClientAddress();
    console.log(`[${client}] requested ${url} as a ${format}`);
    
    const tempId: string = randomUUID();
    const tempFile: string = path.join(os.tmpdir(), `${tempId}.${format}`);
    
    console.log(`[${client} | ${tempId}] Fetching metadata...`);
    let { stdout, stderr } = await execFileAsync('ytdl', ['--dump-json',  url]);
    const metadata: any = JSON.parse(stdout);
    const encodedTitle: string = metadata.title
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9.]+/g, '_');
    const filename = `${encodedTitle}.${format}`

    console.log(`[${client} | ${tempId}] Fetching video...`);

    let webmAvailable = false;
    const formats: Array<FormatMetadata> = metadata.formats;
    formats.forEach((format: FormatMetadata) => {
      if (format.video_ext === "webm") webmAvailable = true;
      return;
    });

    if (format === 'webm' && webmAvailable) {
      await execFileAsync('ytdl', ['-o', tempFile, url]);
    } else if (format === 'webm') {
      // if we dont have webm available, grab an mp4 and convert it
      console.log(`[${client} | ${tempId}] webm not available, fetching mp4 and converting...`);
      const tempMp4: string = path.join(os.tmpdir(), `${tempId}.mp4`);
      await execFileAsync('ytdl', ['-o', tempMp4, url, '-t', 'mp4']);
      await execFileAsync('ffmpeg', ['-i', tempMp4, tempFile]);
      fs.unlink(tempMp4, () => {});
    } else {
      await execFileAsync('ytdl', ['-o', tempFile, '-t', format, url]);
    }
    console.log(`[${client} | ${tempId}] Saved video to '${tempFile}'`);

    console.log(`[${client} | ${tempId}] Serving ${tempFile} as ${filename}...`);
    const fileStream: fs.ReadStream = fs.createReadStream(tempFile);
    fileStream.on('close', () => {
      console.log(`[${client} | ${tempId}] Finished serving!`);
      fs.unlink(tempFile, () => {});
    });

    return new Response(fileStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error(error);
    console.log("Invalid URL.");
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Invalid URL!",
      }),
      {
        status: 400,
        error: "Invalid URL",
      }
    );
  }

}
