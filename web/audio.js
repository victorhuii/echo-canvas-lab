// A persistent browser graph. Geometry stays outside the audio callback.
export class AudioEngine {
 constructor(factory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()){
  this.factory=factory;this.context=null;this.playing=false;this.nodes=new Map();this.assets=new Map();this.level=.25;
 }
 ensureContext(){
  if(this.context)return this.context;
  const c=this.context=this.factory();this.master=c.createGain();this.master.gain.value=0;
  const compressor=c.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=20;compressor.ratio.value=8;this.master.connect(compressor);compressor.connect(c.destination);
  this.tail=c.createGain();this.wet=c.createGain();this.wet.gain.value=0;this.wet.connect(this.master);this.combs=[];
  for(const time of [.0297,.0371,.0411,.0437]){
   const delay=c.createDelay(1),damp=c.createBiquadFilter(),feedback=c.createGain(),out=c.createGain();
   delay.delayTime.value=time;damp.type='lowpass';damp.frequency.value=3600;feedback.gain.value=.6;out.gain.value=.18;
   this.tail.connect(delay);delay.connect(damp);damp.connect(feedback);feedback.connect(delay);damp.connect(out);out.connect(this.wet);this.combs.push({time,feedback});
  }
  return c;
 }
 set(param,value){param.setTargetAtTime(value,this.context.currentTime,.025);}
 async start(scene,result,mode='simulated',revision=result?.revision){
  if(!result||result.revision!==revision)throw Error('Wait for accepted acoustic results before playback');
  this.ensureContext();await this.context.resume();this.playing=true;this.update(scene,result,mode,revision);
 }
 async stop(){this.playing=false;if(this.context){this.set(this.master.gain,0);await this.context.suspend();}}
 mute(){if(this.context)this.set(this.master.gain,0);}
 async loadAsset(id,bytes){if(bytes.byteLength>20_000_000)throw Error('Audio file limit is 20 MB');const c=this.ensureContext();const buffer=await c.decodeAudioData(bytes.slice(0));if(buffer.duration>300)throw Error('Audio file limit is five minutes');this.assets.set(id,buffer);return buffer.duration;}
 createSource(source){
  const c=this.context;let input;
  if(source.type==='tone'){input=c.createOscillator();input.type='sine';input.frequency.value=source.frequency;}
  else{input=c.createBufferSource();input.loop=true;
   if(source.type==='file')input.buffer=this.assets.get(source.assetId);
   else{const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=buffer.getChannelData(0);let seed=1234567;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=((seed/4294967296)*2-1)*.35;}input.buffer=buffer;}
  }
  if(source.type==='file'&&!input.buffer)return null;
  const raw=c.createGain();raw.gain.value=0;input.connect(raw);raw.connect(this.master);
  const send=c.createGain();send.gain.value=0;input.connect(send);send.connect(this.tail);
  const paths=[];
  for(let i=0;i<7;i++){
   const gain=c.createGain(),filter=c.createBiquadFilter(),delay=c.createDelay(1),panner=c.createPanner();
   gain.gain.value=0;filter.type='lowpass';filter.frequency.value=18000;panner.panningModel='HRTF';panner.distanceModel='inverse';panner.rolloffFactor=0;panner.refDistance=1;
   input.connect(gain);gain.connect(filter);filter.connect(delay);delay.connect(panner);panner.connect(this.master);paths.push({gain,filter,delay,panner});
  }
  input.start();return {key:source.type+':'+(source.assetId||''),input,raw,send,paths};
 }
 release(node){try{node.input.stop();}catch{}node.input.disconnect();node.raw.disconnect();node.send.disconnect();for(const p of node.paths)for(const item of [p.gain,p.filter,p.delay,p.panner])item.disconnect();}
 update(scene,result,mode='simulated',revision=result?.revision){
  if(!this.context||!this.playing)return false;
  if(!result||result.revision!==revision||result.mode!==scene.mode||result.listener.id!==scene.activeListener){this.mute();return false;}
  const c=this.context,listener=c.listener,l=result.listener;
  for(const [axis,value] of [['X',l.x],['Y',l.z],['Z',-l.y]])this.set(listener['position'+axis],value);
  const yaw=l.yaw*Math.PI/180;this.set(listener.forwardX,Math.cos(yaw));this.set(listener.forwardY,0);this.set(listener.forwardZ,-Math.sin(yaw));this.set(listener.upX,0);this.set(listener.upY,1);this.set(listener.upZ,0);
  const enabled=scene.sources.filter(s=>s.enabled);const rows=new Map(result.sources.map(s=>[s.id,s]));
  for(const [id,node] of this.nodes)if(!enabled.some(s=>s.id===id)){this.release(node);this.nodes.delete(id);}
  for(const source of enabled){
   const row=rows.get(source.id);if(!row)continue;let node=this.nodes.get(source.id);const key=source.type+':'+(source.assetId||'');
   if(node&&node.key!==key){this.release(node);this.nodes.delete(source.id);node=null;}
   if(!node){node=this.createSource(source);if(!node)continue;this.nodes.set(source.id,node);}
   if(source.type==='tone')this.set(node.input.frequency,source.frequency);
   this.set(node.raw.gain,mode==='raw'?source.gain:0);this.set(node.send.gain,mode==='simulated'?source.gain*.08:0);
   const paths=[row.direct,...row.reflections];
   for(let i=0;i<node.paths.length;i++){
    const n=node.paths[i],p=paths[i];this.set(n.gain.gain,mode==='simulated'&&p?source.gain*p.gain:0);
    if(!p)continue;this.set(n.delay.delayTime,Math.min(.8,p.length/343));this.set(n.filter.frequency,Math.max(400,18000*Math.pow(10,-(p.lossDb||0)/60)));
    for(const [axis,value] of [['X',p.position.x],['Y',p.position.z],['Z',-p.position.y]])this.set(n.panner['position'+axis],value);
   }
  }
  for(const comb of this.combs)this.set(comb.feedback.gain,Math.min(.88,Math.pow(.001,comb.time/result.rt60)));
  this.set(this.wet.gain,mode==='simulated'?1:0);
  this.set(this.master.gain,this.level*.2/Math.sqrt(Math.max(1,enabled.length)));return true;
 }
 async dispose(){for(const n of this.nodes.values())this.release(n);this.nodes.clear();if(this.context)await this.context.close();this.context=null;this.playing=false;}
}
