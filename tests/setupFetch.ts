import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { TransformStream, WritableStream } from 'node:stream/web';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.TransformStream = TransformStream as any;
global.WritableStream = WritableStream as any;

if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class {
    name: string;
    onmessage: ((ev: MessageEvent) => any) | null = null;
    onmessageerror: ((ev: MessageEvent) => any) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(message: any) {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  } as any;
}
