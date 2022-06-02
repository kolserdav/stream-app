import React, { useEffect, useMemo, useState } from 'react';
import s from './Room.module.scss';
import {
  log,
  MediaConstraints,
  CODECS,
  getCodec,
  getVideoRef,
  wsSendBinary,
  wsSendJson,
} from '../../utils';
import { WSTypes } from '../../server';

let started = false;

function Room() {
  const mimeType = useMemo(() => getCodec(), []);
  const protocol = /s/.test(window.location.protocol) ? 'wss' : 'ws';
  const connection = useMemo(
    () => new WebSocket(`${protocol}://${process.env.REACT_APP_SERVER_URL}/`, 'json'),
    []
  );
  const [timeout, setTimeout] = useState<any>(
    setInterval(() => {
      /** */
    }, Infinity)
  );
  const [connected, setConnected] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream>(new MediaStream());
  const [remoteStream, setRemoteStream] = useState<string>();
  const [time, setTime] = useState<number>(0);
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
              if (!started) {
                started = true;
                setTimeout(() => {
                  setRemoteStream(
                    `${window.location.protocol}://${process.env.REACT_APP_SERVER_URL}/stream/1`
                  );
                });
              }
              if (e.data.size > 0) {
                wsSendBinary(connection, e.data);
              }
            };
            connection.onmessage = (e) => {
              if (!(e.data instanceof Blob)) {
                setTime(JSON.parse(e.data).data);
              }
            };
            const _timeout = setInterval(() => {
              mediaRecorder.requestData();
            }, 20);
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
  }, [connected, connection, mimeType]);

  const _localStream = useMemo(() => getVideoRef(localStream), [localStream]);
  return (
    <div className={s.wrapper}>
      <video
        muted
        autoPlay
        width={640}
        height={480}
        ref={_localStream}
        onTimeUpdate={(e: any) => {
          wsSendJson(connection, { type: WSTypes.timeUpdate, data: e.target.currentTime });
        }}
      />
      <video
        preload="auto"
        width={640}
        height={480}
        onTimeUpdate={(e: any) => {
          if (time - e.target.currentTime > 2) {
            console.log(e);
            console.log(e.target.currentTime, time);
            e.target.currentTime = time - 1;
          }
        }}
        onLoadedMetadata={(e: any) => {
          console.log(12);
          e.target.play();
        }}
      >
        {remoteStream && <source src={remoteStream} type={mimeType} />}
      </video>
    </div>
  );
}

export default Room;
