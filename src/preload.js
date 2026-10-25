import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('seshdBreak', {
  start: (breakDetails) => ipcRenderer.invoke('break-enforcement:start', breakDetails),
  end: () => ipcRenderer.invoke('break-enforcement:end'),
});
