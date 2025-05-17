const urlInput = document.getElementById('url');
const getBtn = document.getElementById('getBtn');
const downloadBtn = document.getElementById('downloadBtn');
const codecSelect = document.getElementById('codec');
const audioOnlyCheckbox = document.getElementById('audioOnly');
const formatTable = document.getElementById('formatTable');
const progress = document.getElementById('progress');

let formats = [];
let selectedFormat = null;

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

getBtn.onclick = async () => {
  const url = urlInput.value.trim();
  const codecFilter = codecSelect.value;

  if (!url) return alert('Input URL');
  formatTable.innerHTML = '<tr><td>Loading...</td></tr>';

  const raw = await window.api.fetchFormats(url);
  const lines = raw.split('\n').filter(l => /^\d/.test(l));

  formats = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    return {
      format: parts[0],
      ext: parts[1],
      resolution: parts[2],
      note: parts.slice(3).join(' '),
    };
  });

  const filtered = formats.filter(f => {
    if (codecFilter === 'all') return true;
    const codec = f.note.toLowerCase();
    return codec.includes(codecFilter);
  });

  formatTable.innerHTML = '';
  filtered.forEach(f => {
    const row = formatTable.insertRow();
    row.innerHTML = `<td>${f.format}</td><td>${f.ext}</td><td>${f.resolution}</td><td>${f.note}</td>`;
    row.onclick = () => {
      selectedFormat = f.format;
      Array.from(formatTable.rows).forEach(r => r.style.background = '');
      row.style.background = '#cceeff';
    };
  });
  downloadBtn.style.display = "inline-block";
};

downloadBtn.onclick = async () => {
  const url = urlInput.value.trim();
  const isAudio = audioOnlyCheckbox.checked;

  progress.style.display = "inline-block";

  if (!url || (!isAudio && !selectedFormat)) {
    alert('Input URL and select format to download');
    return;
  }

  const output = await window.api.selectSavePath(isAudio);
  if (!output) return;

  progress.value = 0;
  downloadBtn.style.display = "none";

  await window.api.download({
    url,
    format: selectedFormat,
    output,
    mode: isAudio ? 'audio' : 'video',
  });

  new Notification("File Downloaded", {
    body: `File ${output} saved.`,
  });
  progress.style.display = "none";
  downloadBtn.style.display = "inline-block";
};

window.api.onProgress(percent => {
  progress.value = percent;
});
