import {RAIL,STATION,SOUTH_STATION,crossings,railLength,railPose} from './rail-layout.js?v=5.5.0';

const speed=68,dwell=6,spacing=90,tailLength=3*spacing;
const eastStop=STATION.x-RAIL.x0;
const southStop=railLength-(SOUTH_STATION.x-4130);
const serviceStart=-490,serviceEnd=railLength+500;
const cycle=(serviceEnd-serviceStart)/speed+2*dwell;
const schedules=[
 {dir:1,start:serviceStart,phase:14,stops:[eastStop,southStop]},
 {dir:-1,start:serviceEnd,phase:(serviceEnd-(RAIL.x1+490-RAIL.x0))/speed+dwell+51,stops:[southStop,eastStop]}
];
function timetable({dir,start,phase,stops},time){
 let elapsed=(time+phase)%cycle,distance=start;
 for(const stop of stops){
  const approach=Math.abs(stop+dir*tailLength/2-distance)/speed;
  if(elapsed<approach)return {lead:distance+dir*elapsed*speed,moving:true};
  distance=stop+dir*tailLength/2;
  if(elapsed<approach+dwell)return {lead:distance,moving:false};
  elapsed-=approach+dwell;
 }
 return {lead:distance+dir*elapsed*speed,moving:true};
}
let lastTime=NaN,previous=[];
export function trainsAt(time){
 if(time===lastTime)return previous;
 lastTime=time;
 previous=schedules.flatMap((plan,k)=>{
  const {lead,moving}=timetable(plan,time),{dir}=plan;
  return Array.from({length:4},(_,i)=>{
   const distance=lead-dir*i*spacing,pose=railPose(distance);
   const c=Math.cos(pose.angle),n=Math.sin(pose.angle);
   const velocity=moving?dir*speed:0;
   return {id:'train-'+k+'-'+i,kind:'train',distance,
    x:pose.x+dir*pose.normal[0]*17,y:pose.y+dir*pose.normal[1]*17,z:pose.z,
    angle:pose.angle+(dir<0?Math.PI:0),w:84,d:29,h:38,dir,vx:velocity*c,vy:velocity*n,head:i===0};
  });
 });
 return previous;
}
export function trainInView(train){return train.distance>=-80&&train.distance<=railLength+80;}
export function crossingActive(c,time){
 if(!c)return false;
 return trainsAt(time).some(t=>trainInView(t)&&t.z<95&&Math.hypot(t.x-c.x,t.y-c.y)<230);
}
const crossingById=new Map(crossings.map(c=>[c.id,c]));
export function crossingFor(id){return crossingById.get(id);}
export function inStation(t){return [STATION,SOUTH_STATION].some(s=>Math.abs(t.x-s.x)<s.w/2+50&&Math.abs(t.y-s.y)<s.d/2);}
