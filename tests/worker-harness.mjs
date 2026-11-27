import {parentPort} from 'node:worker_threads';
globalThis.self={postMessage:value=>parentPort.postMessage(value)};
await import('../web/worker.js');
parentPort.on('message',data=>self.onmessage({data}));
