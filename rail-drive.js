import {railSegments} from './rail-layout.js?v=5.4.0';

export const railEntrances=[
 {id:'rail-west-entry',name:'高架入口・西',x:3180,y:1200,railEntry:true,heading:0,approach:[[3060,1200],[3180,1200]],rampLength:310},
 {id:'rail-south-entry',name:'高架入口・南',x:5600,y:7400,railEntry:true,heading:0,approach:[[5520,7400],[5600,7400]],rampLength:300}
];
export const railExits=[
 {id:'rail-west-exit',name:'高架出口・西',x:3490,y:1200,railExit:true,entryId:'rail-west-entry',landing:[3060,1200]},
 {id:'rail-south-exit',name:'高架出口・南',x:5810,y:7400,railExit:true,entryId:'rail-south-entry',landing:[5520,7400]}
];
export const railAccessPoints=[...railEntrances,...railExits];
export function exitedRailGuide(s){
 const exit=railExits.find(p=>p.id===s.serviceGuide);
 if(!exit||s.broken||s.z>4||(s.deck??0)>4||Math.hypot(s.x-exit.landing[0],s.y-exit.landing[1])>=32)return null;
 s.serviceGuide=null;return exit;
}
export function railExitPath(x,y,exit){
 const start=railProjection(x,y),end=railProjection(...exit.landing),forward=end.along>=start.along;
 const between=railSegments.map(r=>({point:r.b.slice(0,2),along:r.end})).filter(p=>p.along>Math.min(start.along,end.along)+.01&&p.along<Math.max(start.along,end.along)-.01);
 if(!forward)between.reverse();
 return [start.point,...between.map(p=>p.point),end.point];
}
export function enteredRailGuide(s){
 const entry=railEntrances.find(p=>p.id===s.serviceGuide);
 if(!entry||s.broken||s.z>4||s.surface!=='rail'||s.deck<8)return null;
 const dx=s.x-entry.x,dy=s.y-entry.y,along=dx*Math.cos(entry.heading)+dy*Math.sin(entry.heading),side=-dx*Math.sin(entry.heading)+dy*Math.cos(entry.heading);
 if(along<0||along>entry.rampLength+60||Math.abs(side)>44)return null;
 s.serviceGuide=null;return entry;
}
export function railProjection(x,y){
 let best=null;
 for(const r of railSegments){
  const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],length=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,((x-r.a[0])*dx+(y-r.a[1])*dy)/(length*length)));
  const px=r.a[0]+dx*t,py=r.a[1]+dy*t,gap=Math.hypot(px-x,py-y);
  if(!best||gap<best.gap)best={point:[px,py],along:r.start+t*length,height:r.a[2]+(r.b[2]-r.a[2])*t,gap,angle:r.angle,grade:(r.b[2]-r.a[2])/length};
 }
 return best;
}
export function railSurface(x,y){const p=railProjection(x,y);return p?.gap<=44?p:null;}
export function updateRailSurface(s){
 const surface=railSurface(s.x,s.y),old=s.deck??0;
 if(s.surface==='rail'){
  if(surface){s.deck=surface.height;return;}
  s.surface='ground';s.deck=0;if(old>0)s.z+=old;
 }else if(surface&&((surface.height<5&&s.z<4)||(s.vz<=0&&s.z>=surface.height&&s.z-surface.height<8))){
  s.surface='rail';s.deck=surface.height;s.z=Math.max(0,s.z-surface.height);
 }
}
