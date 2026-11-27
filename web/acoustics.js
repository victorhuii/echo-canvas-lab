import {MATERIALS,validateScene} from './scene.js';
const EPS=1e-7;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const interpolate=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export function intersection(a,b,w){
 const p={x:w.x1,y:w.y1},q={x:w.x2,y:w.y2};const r=sub(b,a),v=sub(q,p),pa=sub(p,a);const denom=cross(r,v);
 if(Math.abs(denom)<EPS){
  if(Math.abs(cross(pa,r))>EPS||Math.hypot(r.x,r.y)<EPS)return null;
  const len=r.x*r.x+r.y*r.y;const t1=(pa.x*r.x+pa.y*r.y)/len;const qa=sub(q,a);const t2=(qa.x*r.x+qa.y*r.y)/len;
  const lo=Math.max(EPS,Math.min(t1,t2)),hi=Math.min(1-EPS,Math.max(t1,t2));if(lo>hi)return null;
  const t=(lo+hi)/2,point=interpolate(a,b,t);const wl=v.x*v.x+v.y*v.y;return {t,u:((point.x-p.x)*v.x+(point.y-p.y)*v.y)/wl,point};
 }
 const t=cross(pa,v)/denom,u=cross(pa,r)/denom;
 if(t<=EPS||t>=1-EPS||u< -EPS||u>1+EPS)return null;
 return {t,u,point:interpolate(a,b,t)};
}
export function isOpening(w,u,z){return w.door.enabled&&Math.abs(u*Math.hypot(w.x2-w.x1,w.y2-w.y1)-w.door.center)<=w.door.width/2+EPS&&z>=w.zMin-EPS&&z<=w.zMin+w.door.height+EPS;}
export function blockers(a,b,scene,ignore=null){
 const hits=[];for(const w of scene.walls){if(!w.enabled||w.id===ignore)continue;const hit=intersection(a,b,w);if(hit&&hit.point.z>=w.zMin-EPS&&hit.point.z<=w.zMax+EPS&&!isOpening(w,hit.u,hit.point.z))hits.push(w);}return hits;
}
export function portalRoute(source,listener,scene){
 const nodes=[source,listener];
 for(const w of scene.walls){if(!w.enabled||!w.door.enabled)continue;const length=Math.hypot(w.x2-w.x1,w.y2-w.y1);const t=w.door.center/length;nodes.push({x:w.x1+(w.x2-w.x1)*t,y:w.y1+(w.y2-w.y1)*t,z:Math.max(w.zMin+.01,Math.min(w.zMin+w.door.height-.01,(source.z+listener.z)/2))});}
 const costs=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();costs[0]=0;
 for(let i=0;i<nodes.length;i++){
  let u=-1;for(let k=0;k<nodes.length;k++)if(!done.has(k)&&(u===-1||costs[k]<costs[u]))u=k;
  if(u===-1||!Number.isFinite(costs[u]))break;done.add(u);if(u===1)break;
  for(let v=0;v<nodes.length;v++){if(v===u||done.has(v)||blockers(nodes[u],nodes[v],scene).length)continue;const alt=costs[u]+distance(nodes[u],nodes[v]);if(alt<costs[v]){costs[v]=alt;prev[v]=u;}}
 }
 if(!Number.isFinite(costs[1]))return null;
 const path=[];for(let at=1;at!==-1;at=prev[at])path.unshift(nodes[at]);return {points:path,length:costs[1]};
}
function verticalReflection(source,listener,wall,scene){
 const dx=wall.x2-wall.x1,dy=wall.y2-wall.y1,len=Math.hypot(dx,dy);const nx=-dy/len,ny=dx/len;
 const side=p=>(p.x-wall.x1)*nx+(p.y-wall.y1)*ny;
 if(side(source)*side(listener)<=EPS)return null;
 const d=side(source),mirror={x:source.x-2*d*nx,y:source.y-2*d*ny,z:source.z};
 const hit=intersection(mirror,listener,wall);if(!hit||hit.point.z<wall.zMin||hit.point.z>wall.zMax||wall.door&&isOpening(wall,hit.u,hit.point.z))return null;
 const p=hit.point;if(blockers(source,p,scene,wall.id).length||blockers(p,listener,scene,wall.id).length)return null;
 const length=distance(source,p)+distance(p,listener);return {kind:'reflection',surface:wall.name,points:[source,p,listener],position:p,length,gain:.35*Math.sqrt(1-MATERIALS[wall.material].absorption)/(1+length)};
}
export function reflections(source,listener,scene){
 const r=scene.room;const wall=(id,x1,y1,x2,y2)=>({id,name:id,x1,y1,x2,y2,zMin:0,zMax:r.height,material:r.material});
 const walls=[wall('west',0,0,0,r.depth),wall('east',r.width,0,r.width,r.depth),wall('north',0,0,r.width,0),wall('south',0,r.depth,r.width,r.depth),...scene.walls.filter(w=>w.enabled)];
 const out=walls.map(w=>verticalReflection(source,listener,w,scene)).filter(Boolean);
 if(scene.mode==='3d')for(const [name,z] of [['floor',0],['ceiling',r.height]]){
  const mirror={...source,z:2*z-source.z},denom=listener.z-mirror.z;
  if(Math.abs(denom)<EPS)continue;const t=(z-mirror.z)/denom;if(t<=EPS||t>=1-EPS)continue;const p=interpolate(mirror,listener,t);
  if(p.x<0||p.x>r.width||p.y<0||p.y>r.depth||blockers(source,p,scene).length||blockers(p,listener,scene).length)continue;
  const length=distance(source,p)+distance(p,listener);out.push({kind:'reflection',surface:name,points:[source,p,listener],position:p,length,gain:.35*Math.sqrt(1-MATERIALS[r.material].absorption)/(1+length)});
 }
 return out.sort((a,b)=>b.gain-a.gain).slice(0,6);
}
export function reverbEstimate(scene){
 const r=scene.room,volume=r.width*r.depth*r.height,area=2*(r.width*r.depth+r.width*r.height+r.depth*r.height);let absorption=area*MATERIALS[r.material].absorption;
 for(const w of scene.walls.filter(w=>w.enabled)){const surface=Math.hypot(w.x2-w.x1,w.y2-w.y1)*(w.zMax-w.zMin);const opening=w.door.enabled?w.door.width*w.door.height:0;absorption+=2*Math.max(0,surface-opening)*MATERIALS[w.material].absorption+opening;}
 return Math.max(.15,Math.min(4,.161*volume/Math.max(1,absorption)));
}
export function computeScene(input,revision=0){
 const scene=validateScene(input);const listener=scene.listeners.find(l=>l.id===scene.activeListener);const sources=[];
 for(const source of scene.sources.filter(s=>s.enabled)){
  const hits=blockers(source,listener,scene);const lossDb=hits.reduce((sum,w)=>sum+MATERIALS[w.material].lossDb,0);
  const straight=distance(source,listener);const route=hits.length?portalRoute(source,listener,scene):null;
  const length=route?.length??straight;const kind=route?'portal':hits.length?'occluded':'direct';const effectiveLoss=route?0:lossDb;
  const direct={kind,points:route?.points??[source,listener],position:route?route.points.at(-2):source,length,lossDb:effectiveLoss,gain:Math.pow(10,-effectiveLoss/20)/(1+length),blockedBy:hits.map(w=>w.name)};
  sources.push({id:source.id,direct,reflections:reflections(source,listener,scene)});
 }
 return {revision,listener,sources,rt60:reverbEstimate(scene),mode:scene.mode};
}
