import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export async function POST({ request, getClientAddress }) {
  const signal = request.signal;

  try {
    const { url, format } = await request.json();
    const client = request.headers.get('x-forwarded-for')?.split(',')[0] || getClientAddress();
    console.log(`[${client}] requested ${url} as a ${format}`);
    
    const tempId = randomUUID();
    const tempFile = path.join(os.tmpdir(), `${tempId}.${format}`);
    
    console.log(`[${client} | ${tempId}] Fetching metadata...`);
    let { stdout, stderr } = await execFileAsync('ytdl', ['--dump-json',  url]);
    const metadata = JSON.parse(stdout);
    const encodedTitle = metadata.title
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9.]+/g, '_');
    const filename = `${encodedTitle}.${format}`

    console.log(`[${client} | ${tempId}] Fetching video...`);
    if (format === 'webm') {
      await execFileAsync('ytdl', ['-o', tempFile, url]);
    } else {
      await execFileAsync('ytdl', ['-o', tempFile, '-t', format, url]);
    }
    console.log(`[${client} | ${tempId}] Saved video to '${tempFile}'`);

    console.log(`[${client} | ${tempId}] Serving ${tempFile} as ${filename}...`);
    const fileStream = fs.createReadStream(tempFile);
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
