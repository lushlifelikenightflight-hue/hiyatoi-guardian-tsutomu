import {project} from './art.js?v=5.6.0';
export class SceneStream{
 constructor(renderer){this.r=renderer;this.pending=new Set();this.objects=new Map(renderer.static.map(o=>[o.data.id,o]));this.waiters=[];this.active=false;this.errors=[];this.preview=new Map();this.status('fallback');
  if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined')return;
  try{this.worker=new Worker(new URL('./scene-worker.js?v=5.6.0',import.meta.url),{type:'module'});this.active=true;this.status('preparing');this.worker.onmessage=({data})=>this.receive(data);this.worker.onerror=e=>{this.errors.push(e.message);this.active=false;this.status('fallback');this.worker.terminate();this.waiters.splice(0).forEach(f=>f());};}catch(e){this.errors.push(String(e));}
 }
 status(mode){if(this.r.canvas?.dataset)this.r.canvas.dataset.terrain=mode;}
 receive(data){this.pending.delete(data.key);if(data.error){this.errors.push(data.error);this.active=false;this.status('fallback');this.worker.terminate();this.waiters.splice(0).forEach(f=>f());return;}
  if(data.kind==='ground'){this.status('worker');this.r.groundTiles.set(data.key,data.image);this.preview.delete(data.key);while(this.r.groundTiles.size>32){const key=this.r.groundTiles.keys().next().value;this.r.groundTiles.get(key)?.close?.();this.r.groundTiles.delete(key);}(this.r.tileMetrics??=[]).push({key:data.key,ms:data.ms,worker:true});}
  else{const o=this.objects.get(data.id);if(o){o.sprite={image:data.image,anchor:data.anchor};o.shadow={image:data.shadow,anchor:data.shadowAnchor};}}
  if(this.r.tileMetrics?.length>200)this.r.tileMetrics.shift();this.waiters.splice(0).forEach(f=>f());
 }
 request(kind,key,payload){if(!this.active||this.pending.has(key))return;this.pending.add(key);this.worker.postMessage({kind,key,...payload});}
 update(cp,W,H,zoom,ox,oy,camera){if(!this.active)return;const cell=Math.floor(cp.x/192)+','+Math.floor(cp.y/192)+':'+W+','+H+':'+Math.round(zoom*10);if(cell===this.lastView)return;this.lastView=cell;this.worker.postMessage({kind:'view',x:cp.x,y:cp.y});
  const x0=Math.floor(-ox/zoom/768),x1=Math.floor((W-ox)/zoom/768),y0=Math.floor(-oy/zoom/768),y1=Math.floor((H-oy)/zoom/768),tiles=[];
  for(let x=x0-1;x<=x1+1;x++)for(let y=y0-1;y<=y1+1;y++)tiles.push({x:x*768,y:y*768,visible:x>=x0&&x<=x1&&y>=y0&&y<=y1});
  tiles.sort((a,b)=>Number(b.visible)-Number(a.visible)||Math.hypot(a.x+384-cp.x,a.y+384-cp.y)-Math.hypot(b.x+384-cp.x,b.y+384-cp.y));
  for(const t of tiles){const key=t.x+','+t.y;if(!this.r.groundTiles.has(key))this.request('ground',key,{x:t.x,y:t.y,visible:t.visible});}
  for(const o of this.r.static)if(!o.sprite&&Math.hypot(o.x-camera.x,o.y-camera.y)<1700)this.request('object','object:'+o.data.id,{id:o.data.id});
 }
 async prepare(camera){if(!this.active)return;const r=this.r,cp=project(camera.x,camera.y),W=r.canvas.width,H=r.canvas.height,ox=W/2-cp.x*r.zoom,oy=H*.55-cp.y*r.zoom;this.update(cp,W,H,r.zoom,ox,oy,camera);
  const keys=[];for(let x=Math.floor(-ox/r.zoom/768)*768;x<(W-ox)/r.zoom;x+=768)for(let y=Math.floor(-oy/r.zoom/768)*768;y<(H-oy)/r.zoom;y+=768)keys.push(x+','+y);
  await new Promise(resolve=>{const timeout=setTimeout(()=>{this.active=false;this.status('fallback');this.worker.terminate();resolve();},10000);const check=()=>{if(!this.active||keys.every(k=>r.groundTiles.has(k))){clearTimeout(timeout);resolve();}else this.waiters.push(check);};check();});
 }
}
