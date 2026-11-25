import {Renderer} from './scene-renderer.js?v=5.3.0';
import {LandscapeRenderer} from './landscape-renderer.js?v=5.3.0';
import {warpGroundTile} from './terrain-warp.js?v=5.3.0';
import {world} from './world.js?v=5.3.0';
import {project} from './art.js?v=5.3.0';
const renderer=Object.assign(Object.create(Renderer.prototype),{flatTiles:new Map(),landscape:new LandscapeRenderer()}),jobs=new Map();let running=false,focus={x:0,y:0};
self.onmessage=({data})=>{if(data.kind==='view'){focus=data;return;}jobs.set(data.key,data);if(!running){running=true;setTimeout(run,0);}};
function score(job){const p=job.kind==='ground'?{x:job.x+384,y:job.y+384}:project(world.byId.get(job.id)?.x??0,world.byId.get(job.id)?.y??0);return Math.hypot(p.x-focus.x,p.y-focus.y)+(job.kind==='object'?450:job.visible?-2000:0);}
async function run(){const job=[...jobs.values()].sort((a,b)=>score(a)-score(b))[0];if(!job){running=false;return;}jobs.delete(job.key);const at=performance.now();
 try{if(job.kind==='ground'){const canvas=warpGroundTile(job.x,job.y,768,(x,y)=>renderer.flatGround(x,y)),image=await createImageBitmap(canvas);self.postMessage({kind:'ground',key:job.key,image,ms:performance.now()-at},[image]);}
  else{const data=world.byId.get(job.id);if(data){const o={data};renderer.bakeObject(o);const image=o.sprite.image.transferToImageBitmap(),shadow=o.shadow.image.transferToImageBitmap();self.postMessage({kind:'object',key:job.key,id:job.id,image,shadow,anchor:o.sprite.anchor,shadowAnchor:o.shadow.anchor},[image,shadow]);}}
 }catch(e){self.postMessage({key:job.key,error:String(e)});}
 setTimeout(run,0);
}
