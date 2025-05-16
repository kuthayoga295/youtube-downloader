const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle('fetch-formats', async (_, url) => {
  const ytDlp = path.join(process.resourcesPath, 'resources', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  return new Promise((resolve, reject) => {
    const output = [];
    const proc = spawn(ytDlp, ['-F', url]);

    proc.stdout.on('data', data => output.push(data.toString()));
    proc.stderr.on('data', data => console.error(data.toString()));
    proc.on('close', () => resolve(output.join('')));
    proc.on('error', reject);
  });
});

ipcMain.handle('select-save-path', async (_, isAudioOnly) => {
  const result = await dialog.showSaveDialog({
    title: 'Save file as',
    defaultPath: isAudioOnly ? 'audio.mp3' : 'video.mkv',
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('download', async (event, { url, format, output, mode }) => {
  const ytDlp = path.join(process.resourcesPath, 'resources', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  const ffmpeg = path.join(process.resourcesPath, 'resources', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

  let args = [];

  if (mode === 'video') {
    args = [
      url, '-f', `${format}+bestaudio`, '-o', output,
      '--ffmpeg-location', ffmpeg,
      '--merge-output-format', 'mkv',
      '--newline'
    ];
  } else {
    args = [
      url, '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--ffmpeg-location', ffmpeg,
      '-o', output,
      '--newline'
    ];
  }

  const proc = spawn(ytDlp, args);

  proc.stdout.on('data', data => {
    const line = data.toString();
    const match = line.match(/(\d+\.\d)%/);
    if (match) {
      event.sender.send('download-progress', parseFloat(match[1]));
    }
  });

  proc.stderr.on('data', data => console.error(data.toString()));

  return new Promise((resolve, reject) => {
    proc.on('close', () => resolve(true));
    proc.on('error', reject);
  });
});
