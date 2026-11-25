import {vfxCatalog} from './vfx-catalog.js?v=5.3.0';
const sheets=new Map();
export async function loadPixelVfx(){await Promise.all(Object.keys(vfxCatalog).map(name=>new Promise(resolve=>{const im=new Image();im.onload=()=>{sheets.set(name,im);resolve();};im.onerror=resolve;im.src='assets/vfx/'+name+'.png';})));}
export function drawPixelVfx(g,name,time,x,y,scale=1,angle=0,options={}){
 const meta=vfxCatalog[name],image=sheets.get(name);if(!image||!meta||time<0)return false;
 let frame=Math.floor(time*meta.fps);if(meta.loop)frame%=meta.frames;else if(frame>=meta.frames)return false;
 const [w,h]=meta.frameSize,[px,py]=options.pivot??meta.pivot;g.save();g.imageSmoothingEnabled=false;g.translate(x,y);g.rotate(angle);g.globalAlpha=options.alpha??1;g.drawImage(image,(frame%meta.columns)*w,Math.floor(frame/meta.columns)*h,w,h,-px*scale,-py*scale,w*scale,h*scale);g.restore();return true;
}
