import { CODECS } from './constants';

export const log = (type: 'info' | 'warn' | 'error', text: string, data?: any) => {
  console[type](type, text, data);
};

export const getCodec = () => {
  let mimeType = '';
  for (let i = 0; CODECS[i]; i++) {
    const item = CODECS[i];
    if (MediaRecorder.isTypeSupported(item) && MediaSource.isTypeSupported(item)) {
      log('info', 'Supported mimetype is', item);
      mimeType = item;
      break;
    }
  }
  return mimeType;
};

export const getVideoRef = (stream: MediaStream) => (node: HTMLVideoElement) => {
  // eslint-disable-next-line no-param-reassign
  if (node) node.srcObject = stream;
};
