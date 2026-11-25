import {WEST_EDGE,SIZE} from './world.js?v=5.3.0';
import {groundHeight} from './elevation.js?v=5.3.0';
// The same world-space shapes drive both the warnings and the hit tests.
export const monsterAttacks=Object.freeze({
 stomp:{name:'踏みつけ',windup:.85,range:150,radius:130,damage:76,color:'#ffb36b'},
 slash:{name:'切り裂き',windup:.75,range:240,halfAngle:.9,damage:60,color:'#ff827b'},
 beam:{name:'破壊光線',windup:1.2,range:820,width:52,damage:84,color:'#78edff'},
 meteor:{name:'メテオ',windup:.9,range:700,radius:82,damage:88,color:'#d4a0ff'}
});
export function chooseMonsterAttack(m,d,random=Math.random){
 const choices=Object.keys(monsterAttacks).filter(k=>(k==='meteor'||d<=monsterAttacks[k].range)&&(k!==m.lastAttack));
 if(!choices.length)return null;return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
}
export function aimMonsterAttack(m,goal,kind){
 if(kind==='beam'){
  const origin=monsterMouth(m),angle=Math.atan2(goal.y-origin.y,goal.x-origin.x),length=Math.max(1,Math.min(monsterAttacks.beam.range,Math.hypot(goal.x-origin.x,goal.y-origin.y)));
  return {kind,x:origin.x,y:origin.y,angle,length,originHeight:origin.height,targetHeight:(goal.deck??0)+(goal.z??0)+8,targetX:origin.x+Math.cos(angle)*length,targetY:origin.y+Math.sin(angle)*length};
 }
 const spec=monsterAttacks[kind],angle=Math.atan2(goal.y-m.y,goal.x-m.x),distance=Math.min(spec.range,Math.hypot(goal.x-m.x,goal.y-m.y));
 return {kind,x:m.x,y:m.y,angle,targetX:m.x+Math.cos(angle)*distance,targetY:m.y+Math.sin(angle)*distance};
}
export function monsterMouth(m){
 // Mouth pixels: (50,122), layer104; bakeStack scale2 and 16 facing bins.
 const yaw=-Math.PI/5,turn=Math.round(((m.heading??0)-Math.PI/2+yaw)/(Math.PI*2)*16)/16*Math.PI*2,heading=turn+Math.PI/2-yaw;
 const x=m.x+Math.cos(heading)*91+Math.sin(heading),y=m.y+Math.sin(heading)*91-Math.cos(heading);
 return {x,y,height:208+groundHeight(m.x,m.y)-groundHeight(x,y)};
}
export function scatterMeteorTargets(m,random=Math.random){
 const targets=[],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 for(let i=0;i<6;i++){
  let x,y;for(let attempt=0;attempt<20;attempt++){
   if(i<3){const angle=random()*Math.PI*2,radius=600+random()*1200;x=clamp(m.x+Math.cos(angle)*radius,WEST_EDGE+100,SIZE.w-100);y=clamp(m.y+Math.sin(angle)*radius,100,SIZE.h-100);}
   else{x=WEST_EDGE+100+random()*(SIZE.w-WEST_EDGE-200);y=100+random()*(SIZE.h-200);}
   if(Math.hypot(x-m.x,y-m.y)>=450&&targets.every(p=>Math.hypot(x-p.x,y-p.y)>220))break;
  }targets.push({x,y});
 }return targets;
}
export function armMonsterAttack(m,goal,kind,random=Math.random){
 const a=aimMonsterAttack(m,goal,kind);if(kind==='meteor')a.targets=scatterMeteorTargets(m,random);return a;
}
export function beamHeightAt(a,x,y){
 const dx=x-a.x,dy=y-a.y,t=Math.max(0,Math.min(1,(dx*Math.cos(a.angle)+dy*Math.sin(a.angle))/(a.length??820)));
 return (groundHeight(a.x,a.y)+(a.originHeight??208))*(1-t)+(groundHeight(a.targetX,a.targetY)+(a.targetHeight??8))*t-groundHeight(x,y);
}
export function monsterAttackHits(a,x,y,r=0){
 const spec=monsterAttacks[a.kind];if(!spec)return false;
 if(a.kind==='stomp'||a.kind==='meteor')return Math.hypot(x-a.targetX,y-a.targetY)<=spec.radius+r;
 const dx=x-a.x,dy=y-a.y,along=dx*Math.cos(a.angle)+dy*Math.sin(a.angle),side=Math.abs(-dx*Math.sin(a.angle)+dy*Math.cos(a.angle));
 if(a.kind==='beam')return along>=-r&&along<=(a.length??spec.range)+r&&side<=spec.width/2+r;
 const distance=Math.hypot(dx,dy),delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-a.angle),Math.cos(Math.atan2(dy,dx)-a.angle));
 return distance<=spec.range+r&&(distance<=r||Math.abs(delta)<=spec.halfAngle+Math.asin(Math.min(1,r/Math.max(1,distance))));
}
export function validMonsterAttack(a){
 return a&&Object.hasOwn(monsterAttacks,a.kind)&&['x','y','targetX','targetY'].every(k=>Number.isFinite(a[k])&&Math.abs(a[k])<=20000)&&Number.isFinite(a.angle)&&Math.abs(a.angle)<=Math.PI*4&&['originHeight','targetHeight','length'].every(k=>a[k]===undefined||Number.isFinite(a[k])&&a[k]>=0&&a[k]<=1000)&&(a.targets===undefined||a.kind==='meteor'&&Array.isArray(a.targets)&&a.targets.length===6&&a.targets.every(p=>p&&Number.isFinite(p.x)&&p.x>=WEST_EDGE&&p.x<=SIZE.w&&Number.isFinite(p.y)&&p.y>=0&&p.y<=SIZE.h));
}
