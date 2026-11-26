import {makeCanvas} from './canvas-factory.js?v=5.5.0';
import {bodyOpacity} from './wreckage.js?v=5.5.0';
import {bakeStack,drawSprite,YAW} from './art.js?v=5.5.0';
export function garageStack(open=false){const layers=[],w=58,d=56;
 for(let z=0;z<34;z++){const im=makeCanvas();im.width=w;im.height=d;const g=im.getContext('2d'),box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  if(z<2){box(0,0,w,d,'#536d70');for(let x=10;x<w-8;x+=18)box(x,20,1,30,'#e1c780');}
  if(z<(open?9:29)){box(1,1,w-2,4,z%5?'#788c8b':'#a8b2a0');box(1,1,4,d-2,'#647f81');box(w-5,1,4,d-2,'#779092');if(z<22)for(const x of [12,40])box(x,8,3,13,z<14?'#d1ad70':'#c9855c');}
  if(z>=24&&z<29){box(0,d-7,w,5,'#2d5760');if(z===27){box(10,d-6,38,2,'#f4d788');}}
  if(!open&&z>=29){box(0,0,w,d,z===33?'#6b8990':'#465f68');if(z===33)for(let y=3;y<d;y+=7)box(1,y,w-2,1,'#8da4a2');}
  layers.push(im);
 }return {layers,w,d,unit:2};}
export function drawGarage(r,s,o,p){const open=Math.hypot(s.x-o.x,s.y-o.y)<160,key=o.data.id+':'+open;r.garageSprites??=new Map();if(!r.garageSprites.has(key))r.garageSprites.set(key,bakeStack(garageStack(open),YAW+o.data.angle,2));drawSprite(r.g,r.garageSprites.get(key),p.x,p.y,r.zoom);if(Math.hypot(s.x-o.x,s.y-o.y)<48)r.drawPlayer(s,bodyOpacity(s,s.time));}
