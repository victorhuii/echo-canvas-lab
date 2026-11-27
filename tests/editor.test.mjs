import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {Window} from 'happy-dom';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('real editor markup and handlers support edits, undo, modes, doorway toggles and escaping',async()=>{
 const window=new Window({url:'http://127.0.0.1:8772',settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
 window.document.write(readFileSync(new URL('../web/index.html',import.meta.url),'utf8'));
 const originals={};for(const key of ['window','document','localStorage','Worker']){originals[key]=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:key==='Worker'?undefined:window[key]});}
 try{
  await import('../web/app.js?editor-test');await tick();
  const doc=window.document;assert.match(doc.getElementById('paths').textContent,/portal/);assert.equal(doc.getElementById('play').disabled,false);
  const roomName=doc.querySelector('#room-form [data-field="name"]');roomName.value='<script>inert</script>';roomName.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();
  assert.equal(doc.querySelector('#room-form [data-field="name"]').value,'<script>inert</script>');assert.equal(doc.querySelectorAll('script').length,1);
  doc.getElementById('objects').querySelector('[data-kind="wall"]').click();await tick();
  const door=doc.querySelector('#object-form [data-field="door.enabled"]');door.checked=false;door.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();assert.match(doc.getElementById('paths').textContent,/occluded/);
  doc.getElementById('undo').click();await tick();assert.match(doc.getElementById('paths').textContent,/portal/);
  const select=doc.getElementById('mode');select.value='3d';select.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();assert.equal(doc.getElementById('elevation-wrap').hidden,false);assert.match(doc.getElementById('elevation').innerHTML,/<polyline/);
  select.value='2.5d';select.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();assert.equal(doc.querySelector('#room-form [data-field="name"]').value,'<script>inert</script>');
  doc.getElementById('add-source').click();await tick();assert.equal(doc.querySelectorAll('#objects [data-kind="source"]').length,3);
  const x=doc.querySelector('#object-form [data-field="x"]');x.value='-100';x.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();assert.match(doc.getElementById('message').textContent,/X must/);assert.ok(Number(doc.querySelector('#object-form [data-field="x"]').value)>=0);
 }finally{
  window.dispatchEvent(new window.Event('pagehide'));window.happyDOM.abort();window.close();for(const [key,value] of Object.entries(originals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}
 }
});
