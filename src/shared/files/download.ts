export function downloadFile(name: string, text: string, type = 'application/json') {
  downloadBlob(name, new Blob([text], { type }));
}
export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
