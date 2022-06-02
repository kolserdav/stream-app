export enum WSTypes {
  push,
  timeUpdate,
}

export interface PushStream {
  type: WSTypes.push;
  data: ArrayBuffer;
}
