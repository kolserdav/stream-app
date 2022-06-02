export enum WSTypes {
  push,
}

export interface PushStream {
  type: WSTypes.push;
  data: ArrayBuffer;
}
