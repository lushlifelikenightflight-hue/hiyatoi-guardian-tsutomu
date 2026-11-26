import {obstruction} from './physics.js?v=5.4.0';
import {isRoad} from './world.js?v=5.4.0';

export function moveToChallengeStart(s,gate,heading){
 if(s.broken)return false;
 for(const distance of [42,60,82,108,138])for(const lateral of [0,-7,7]){
  const x=gate.x-Math.cos(heading)*distance-Math.sin(heading)*lateral;
  const y=gate.y-Math.sin(heading)*distance+Math.cos(heading)*lateral;
  const candidate={...s,x,y,heading,z:0};
  if(!isRoad(x,y)||obstruction(candidate,x,y,s.vehicle,true)||s.crowd?.people.some(p=>Math.hypot(p.x-x,p.y-y)<28))continue;
  Object.assign(s,{x,y,heading,z:0,vz:0,deck:0,surface:'ground',vx:0,vy:0,speed:0,boost:0,airSpeedLimit:undefined,invulnerable:2,safe:{x,y,heading},repairSite:null,repairTime:0});
  return true;
 }
 return false;
}
