import React, { useEffect, useMemo, useState } from 'react';
import s from './Room.module.scss';
import { log, MediaConstraints, CODECS, getCodec, getVideoRef, wsSendBinary } from '../../utils';
import { WSTypes } from '../../server';

const started = false;

function Room() {
  const mimeType = useMemo(() => getCodec(), []);
  const protocol = /s/.test(window.location.protocol) ? 'wss' : 'ws';
  const connection = useMemo(
    () => new WebSocket(`${protocol}://${process.env.REACT_APP_SERVER_URL}/`, 'json'),
    []
  );
  const [timeout, setTimeout] = useState<NodeJS.Timer>(
    setInterval(() => {
      /** */
    }, Infinity)
  );
  const [connected, setConnected] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream>(new MediaStream());
  const [remoteStream, setRemoteStream] = useState<string>();
  useEffect(() => {
    connection.onopen = () => {
      setConnected(true);
    };
    return () => {
      connection.onopen = () => {
        /** */
      };
    };
  }, [connection]);

  useEffect(() => {
    if (navigator.mediaDevices) {
      if (!mimeType) {
        log('warn', 'From all list not one is supported', CODECS);
        return;
      }
      navigator.mediaDevices
        .getUserMedia(MediaConstraints)
        .then((stream) => {
          setLocalStream(stream);
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
          });
          mediaRecorder.onstart = () => {
            const mediaSource = new MediaSource();
            setRemoteStream(URL.createObjectURL(mediaSource));
            mediaSource.addEventListener('sourceopen', sourceOpen);
            function sourceOpen() {
              const buffer = mediaSource.addSourceBuffer(mediaRecorder.mimeType);
              mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0 && !buffer.updating) {
                  wsSendBinary(connection, e.data);
                }
              };
              connection.onmessage = (e: any) => {
                e.data.arrayBuffer().then((data: any) => {
                  if (!buffer.updating) {
                    buffer.appendBuffer(data);
                  }
                });
              };
              const _timeout = setInterval(() => {
                mediaRecorder.requestData();
              }, 10);
              setTimeout(_timeout);
            }
          };
          mediaRecorder.start();
        })
        .catch((err) => {
          log('error', `Get user media failed`, err);
        });
    } else {
      log('warn', 'Get user media is not supported');
    }
  }, [timeout, mimeType]);

  const _localStream = useMemo(() => getVideoRef(localStream), [localStream]);
  return (
    <div className={s.wrapper}>
      <video autoPlay width={640} height={480} ref={_localStream} />
      <video autoPlay width={640} height={480}>
        {remoteStream && <source src={remoteStream} type={mimeType} />}
      </video>
    </div>
  );
}

export default Room;
