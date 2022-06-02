import React, { useEffect, useMemo, useState } from 'react';
import s from './Room.module.scss';
import { log, MediaConstraints, CODECS, getCodec, getVideoRef, wsSendBinary } from '../../utils';
import { WSTypes } from '../../server';

let started = false;

function Room() {
  const mimeType = useMemo(() => getCodec(), []);
  const connection = useMemo(() => new WebSocket('ws://localhost:3001/', 'json'), []);
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
      if (!connected) {
        return;
      }
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
            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                if (!started) {
                  started = true;
                  setRemoteStream('http://localhost:3001/1');
                }
                wsSendBinary(connection, e.data);
              }
            };
            const _timeout = setInterval(() => {
              mediaRecorder.requestData();
            }, 10);
            setTimeout(_timeout);
          };
          mediaRecorder.start();
        })
        .catch((err) => {
          log('error', `Get user media failed`, err);
        });
    } else {
      log('warn', 'Get user media is not supported');
    }
  }, [connection, connected, mimeType]);

  const _localStream = useMemo(() => getVideoRef(localStream), [localStream]);
  return (
    <div className={s.wrapper}>
      <video autoPlay width={640} height={480} ref={_localStream} />
      <video autoPlay width={640} height={480} crossOrigin="anonymous">
        {remoteStream && <source src={remoteStream} type={mimeType} />}
      </video>
    </div>
  );
}

export default Room;
