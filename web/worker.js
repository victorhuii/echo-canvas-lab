import {computeScene} from './acoustics.js';
self.onmessage=event=>{const {scene,revision}=event.data;const start=performance.now();try{self.postMessage({...computeScene(scene,revision),computeMs:performance.now()-start});}catch(error){self.postMessage({revision,error:error.message});}};
