import {segmentDistance} from './geometry.js?v=5.6.0';

export function laneBoostPads(pads,roads){
 return pads.flatMap(p=>{
  if(!['boost','ramp'].includes(p.type))return [p];
  const road=roads.filter(r=>!r.park&&!r.alley&&r.w>=48&&Math.abs(Math.cos(Math.atan2(r.b[1]-r.a[1],r.b[0]-r.a[0])-p.angle))>.96)
   .sort((a,b)=>segmentDistance(p.x,p.y,a)-segmentDistance(p.x,p.y,b))[0];
  if(!road||segmentDistance(p.x,p.y,road)>road.w/2)return [p];
  const dx=road.b[0]-road.a[0],dy=road.b[1]-road.a[1],t=Math.max(0,Math.min(1,((p.x-road.a[0])*dx+(p.y-road.a[1])*dy)/(dx*dx+dy*dy)));
  const x=road.a[0]+dx*t,y=road.a[1]+dy*t,c=Math.cos(p.angle),n=Math.sin(p.angle),offset=road.w/4;
  const w=Math.min(p.w,road.w/2-8);
  return [{...p,x:x+n*offset,y:y-c*offset,w,paired:p.id},
   {...p,id:p.id+'-reverse',x:x-n*offset,y:y+c*offset,w,angle:p.angle+Math.PI,paired:p.id}];
 });
}
