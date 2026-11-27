export const MATERIALS = Object.freeze({concrete:{name:'Concrete',absorption:.08,lossDb:26},wood:{name:'Wood',absorption:.2,lossDb:15},curtain:{name:'Curtain',absorption:.6,lossDb:7},absorber:{name:'Absorber',absorption:.9,lossDb:10}});
const keys=(o,names)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!names.includes(k))||names.some(k=>!(k in o)))throw Error('Scene fields do not match version 1');};
const number=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+' must be '+min+'–'+max);};
const text=(s,max=80)=>{if(typeof s!=='string'||!s.trim()||s.length>max)throw Error('Invalid scene label');};
const flag=v=>{if(typeof v!=='boolean')throw Error('Enabled flags must be boolean');};
export function validateScene(input){
 const s=structuredClone(input);keys(s,['version','name','mode','room','sources','listeners','activeListener','walls']);
 if(s.version!==1||!['2.5d','3d'].includes(s.mode))throw Error('Unsupported scene version or mode');text(s.name);
 keys(s.room,['width','depth','height','material']);number(s.room.width,3,30,'Room width');number(s.room.depth,3,30,'Room depth');number(s.room.height,2,8,'Room height');
 if(!MATERIALS[s.room.material])throw Error('Unsupported room material');
 const ids=new Set();const identify=o=>{text(o.id,50);if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(o.id)||ids.has(o.id))throw Error('Scene IDs must be unique safe identifiers');ids.add(o.id);text(o.name);};
 const point=o=>{number(o.x,0,s.room.width,'X');number(o.y,0,s.room.depth,'Y');number(o.z,0,s.room.height,'Height');};
 if(!Array.isArray(s.sources)||s.sources.length>8||!Array.isArray(s.listeners)||s.listeners.length<1||s.listeners.length>4||!Array.isArray(s.walls)||s.walls.length>12)throw Error('Limit: 8 sources, 4 listeners, 12 walls');
 for(const o of s.sources){keys(o,['id','name','x','y','z','enabled','type','frequency','gain','assetId']);identify(o);point(o);flag(o.enabled);if(!['tone','noise','file'].includes(o.type))throw Error('Unsupported audio type');number(o.frequency,80,1800,'Frequency');number(o.gain,0,.8,'Source gain');if(o.assetId!==null){text(o.assetId,80);if(!/^[a-zA-Z0-9_-]+$/.test(o.assetId))throw Error('Invalid local asset ID');}if(o.type==='file'&&!o.assetId)throw Error('File sources require a local asset ID');}
 for(const o of s.listeners){keys(o,['id','name','x','y','z','yaw']);identify(o);point(o);number(o.yaw,-180,180,'Listener angle');}
 if(!s.listeners.some(l=>l.id===s.activeListener))throw Error('Choose an active listener');
 for(const w of s.walls){keys(w,['id','name','x1','y1','x2','y2','zMin','zMax','material','enabled','door']);identify(w);flag(w.enabled);for(const k of ['x1','x2'])number(w[k],0,s.room.width,k);for(const k of ['y1','y2'])number(w[k],0,s.room.depth,k);number(w.zMin,0,s.room.height,'Wall base');number(w.zMax,0,s.room.height,'Wall top');if(w.zMax<=w.zMin)throw Error('Wall top must exceed its base');if(!MATERIALS[w.material])throw Error('Unsupported wall material');
  const length=Math.hypot(w.x2-w.x1,w.y2-w.y1);if(length<.5)throw Error('Walls must be at least 0.5 m long');keys(w.door,['enabled','center','width','height']);flag(w.door.enabled);number(w.door.width,.2,length-.05,'Door width');number(w.door.center,w.door.width/2,length-w.door.width/2,'Door center');number(w.door.height,.2,w.zMax-w.zMin,'Door height');
 }
 return s;
}
export function preset(mode='2.5d',kind='doorway'){
 const scene={version:1,name:kind==='studio'?'Quiet studio':'Doorway study',mode,room:{width:12,depth:8,height:3,material:kind==='studio'?'absorber':'wood'},sources:[{id:'source-a',name:'Tone A',x:2,y:2,z:1.4,enabled:true,type:'tone',frequency:220,gain:.35,assetId:null},{id:'source-b',name:'Noise B',x:2,y:6,z:1.4,enabled:false,type:'noise',frequency:440,gain:.2,assetId:null}],listeners:[{id:'listener-a',name:'Listener A',x:10,y:2,z:1.6,yaw:180},{id:'listener-b',name:'Listener B',x:10,y:6,z:1.6,yaw:180}],activeListener:'listener-a',walls:kind==='studio'?[]:[{id:'wall-a',name:'Partition',x1:6,y1:0,x2:6,y2:8,zMin:0,zMax:3,material:'concrete',enabled:true,door:{enabled:true,center:5,width:1.4,height:2.2}}]};
 return validateScene(scene);
}
export class RevisionGate{
 constructor(){this.current=0;this.result=null;}
 invalidate(){this.result=null;return ++this.current;}
 accept(result){if(result.revision!==this.current)return false;this.result=result;return true;}
}
export class History{
 constructor(scene){this.scene=validateScene(scene);this.undoStack=[];this.redoStack=[];}
 set(scene,record=true){const next=validateScene(scene);if(record){this.undoStack.push(structuredClone(this.scene));if(this.undoStack.length>50)this.undoStack.shift();this.redoStack=[];}this.scene=next;return next;}
 undo(){if(!this.undoStack.length)return this.scene;this.redoStack.push(this.scene);this.scene=this.undoStack.pop();return this.scene;}
 redo(){if(!this.redoStack.length)return this.scene;this.undoStack.push(this.scene);this.scene=this.redoStack.pop();return this.scene;}
}
