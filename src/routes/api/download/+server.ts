import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export async function POST({ request }) {

  try {
    const { url, format } = await request.json();
    console.log(`Downloading ${url} as a ${format}`);
    
    console.log("Fetching metadata...");
    let { stdout, stderr } = await execFileAsync('ytdl', ['--dump-json',  url]);
    const metadata = JSON.parse(stdout);
    const encodedTitle = encodeURIComponent(metadata.title);
    const filename = `${encodedTitle}.${format}`
    console.log("Constructed filename:", filename);

    console.log("Fetching data...");
    if (format === 'webm') {
      await execFileAsync('ytdl', ['-o', filename, url]);
    } else {
      await execFileAsync('ytdl', ['-o', filename, '-t', format, url]);
    }
    const fileStream = fs.createReadStream(filename);

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
