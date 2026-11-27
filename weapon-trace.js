import {traceVolumeSegment} from './weapon-volume.js?v=5.6.0';
import {robotWeapon,weaponMuzzle} from './robot-motion.js?v=5.6.0';
import {world,isDestroyed} from './world.js?v=5.6.0';
import {bodyOpacity} from './wreckage.js?v=5.6.0';
export function rayCircle(x,y,c,n,target,radius,range){const dx=target.x-x,dy=target.y-y,along=dx*c+dy*n,side=dx*n-dy*c;if(Math.abs(side)>radius)return null;const offset=Math.sqrt(Math.max(0,radius*radius-side*side)),near=along-offset,far=along+offset;return far>=0&&near<=range?Math.max(0,near):null;}
export function rayObject(x,y,c,n,o,width,range){if(o.circle)return rayCircle(x,y,c,n,o,(o.r??7)+width,range);const a=o.angle??0,co=Math.cos(a),si=Math.sin(a),dx=x-o.x,dy=y-o.y,origin=[dx*co+dy*si,-dx*si+dy*co],direction=[c*co+n*si,-c*si+n*co],extent=[o.w/2+width,o.d/2+width];let lo=0,hi=range;for(let i=0;i<2;i++){if(Math.abs(direction[i])<1e-8){if(Math.abs(origin[i])>extent[i])return null;continue;}const a=(-extent[i]-origin[i])/direction[i],b=(extent[i]-origin[i])/direction[i];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return null;}return lo<=range?lo:null;}
function traceLine(s,w){
 const m=s.hero.monster,d=m&&m.hp>0?Math.hypot(m.x-s.x,m.y-s.y):Infinity,angle=w.id!=='cannon'&&d<=w.range&&(s.vehicle!==10||Math.abs(Math.atan2(Math.sin(Math.atan2(m.y-s.y,m.x-s.x)-s.heading),Math.cos(Math.atan2(m.y-s.y,m.x-s.x)-s.heading)))<1.1)?Math.atan2(m.y-s.y,m.x-s.x):s.heading,c=Math.cos(angle),n=Math.sin(angle),wide=['flame','saw','beam-sword'].includes(w.id),width=w.id==='flame'?24:w.id==='beam-sword'?28:w.id==='saw'?16:2,end={x:s.x+c*w.range,y:s.y+n*w.range},hits=[],seen=new Set();
 const add=(type,target,t)=>{if(t!==null&&t>=0&&t<=w.range)hits.push({type,target,distance:t});};
 for(let x=Math.floor((Math.min(s.x,end.x)-width-3)/world.cell);x<=Math.floor((Math.max(s.x,end.x)+width+3)/world.cell);x++)for(let y=Math.floor((Math.min(s.y,end.y)-width-3)/world.cell);y<=Math.floor((Math.max(s.y,end.y)+width+3)/world.cell);y++)for(const o of world.grid.get(x+','+y)??[]){if(seen.has(o.id)||!Number.isFinite(o.hp)||isDestroyed(s,o.id))continue;seen.add(o.id);const t=rayObject(s.x,s.y,c,n,o,width,w.range);if(t!==null)add('object',o,t);}
 for(const car of [...(s.traffic??[]),...(s.responses??[]),...(s.pursuit?.cars??[])])if(car.health>0&&bodyOpacity(car,s.time)>0)add('car',car,rayObject(s.x,s.y,c,n,{...car,w:28,d:16,angle:car.heading},width,w.range));
 for(const p of s.crowd?.people??[])if(!s.struck?.has(p.id))add('person',p,rayCircle(s.x,s.y,c,n,p,4+width,w.range));
 if(m&&m.hp>0)add('monster',m,rayCircle(s.x,s.y,c,n,m,64+width,w.range));
 hits.sort((a,b)=>a.distance-b.distance);const first=hits[0],reach=first?.distance??w.range,targets=wide?hits.filter(h=>h.distance<=Math.min(w.range,(hits.find(h=>h.type==='object')?.distance??w.range)+8)):hits.slice(0,1);
 const height=first?.type==='person'?12:first?.type==='car'?12:first?.type==='monster'?80:first?.type==='object'?Math.min(40,first.target.h*.55):0;
 return {height,targetType:first?.type??null,x:s.x+c*reach,y:s.y+n*reach,angle,reach,range:w.range,locked:first?.type==='monster',blocked:Boolean(first&&first.type!=='monster'),weapon:w.id,hits:targets};
}
export function traceWeapon(s,w){
 if(s.vehicle!==10)return {...traceLine(s,w),origin:weaponMuzzle(s)};
 const rig=robotWeapon(s);if(w.id==='beam-sword')return traceVolumeSegment(s,rig.grip,rig.tip,{width:5,range:w.range,weapon:w.id,cleave:true});
 const guide=traceLine(s,w),m=s.hero.monster,delta=m?Math.atan2(m.y-s.y,m.x-s.x)-s.heading:0,lock=m&&m.hp>0&&Math.hypot(m.x-s.x,m.y-s.y)<=w.range&&Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<1.1;
 let tip=lock?{x:m.x,y:m.y,height:80}:guide;const origin=rig.muzzle,d=Math.hypot(tip.x-origin.x,tip.y-origin.y);if(d>w.range){const t=w.range/d;tip={x:origin.x+(tip.x-origin.x)*t,y:origin.y+(tip.y-origin.y)*t,height:origin.height+(tip.height-origin.height)*t};}
 return traceVolumeSegment(s,origin,tip,{width:2,range:w.range,weapon:w.id});
}
export function weaponTrace(s,w,fresh=false){if(s.vehicle===10)fresh=true;const old=s.weaponTraceCache,key=w.id+':'+s.vehicle;if(!fresh&&old&&old.key===key&&old.revision===(s.weaponTraceRevision??0)&&s.time>=old.time&&s.time-old.time<.05&&Math.hypot(s.x-old.x,s.y-old.y)<2&&Math.abs(s.heading-old.heading)<.015)return old.trace;const trace=traceWeapon(s,w);s.weaponTraceCache={key,revision:s.weaponTraceRevision??0,time:s.time,x:s.x,y:s.y,heading:s.heading,trace};return trace;}
