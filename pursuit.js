import {clamp} from './geometry.js?v=5.6.1';
import {blocked,crossings,roads,responseRoadPath,world} from './world.js?v=5.6.1';
import {crossingActive} from './railway.js?v=5.6.1';
import {collideWithPatrol} from './physics.js?v=5.6.1';

export const escapeStart={id:'escape-start',name:'西の追跡スタート',x:-2145,y:2059.2};
export const chaseLimit=240;
export const patrolPerformance={max:410,accel:215,brake:280,corner:4.2,hp:640,activation:850};
function roadPoint(x,y){
 let best=null;
 for(const r of roads){
  if(r.w<42)continue;
  const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],t=clamp(((x-r.a[0])*dx+(y-r.a[1])*dy)/(dx*dx+dy*dy),.04,.96);
  const px=r.a[0]+dx*t,py=r.a[1]+dy*t,d=Math.hypot(px-x,py-y);
  if((!best||d<best.d)&&!blocked(px,py,10))best={x:px,y:py,heading:Math.atan2(dy,dx),d};
 }
 return best;
}
const terminus=world.byId.get('bus-terminus');
export const pursuitGoal={id:'pursuit-goal',name:'花帆駅南のゴール',...roadPoint(terminus?.stopX??5126,terminus?.stopY??7219),radius:58};
export const pursuitCourse=responseRoadPath(pursuitGoal.x,pursuitGoal.y,[escapeStart]);
function onCourse(fraction){
 let distance=pursuitCourse.distance*fraction;
 const points=pursuitCourse.points;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(distance<=length)return roadPoint(a[0]+(b[0]-a[0])*distance/length,a[1]+(b[1]-a[1])*distance/length);
  distance-=length;
 }
 return roadPoint(pursuitGoal.x,pursuitGoal.y);
}
export const patrolSpawns=[roadPoint(escapeStart.x+230,escapeStart.y-65),...Array.from({length:7},(_,i)=>onCourse(.12+i*.12)),roadPoint(4400,1800),roadPoint(1650,6400)].filter(Boolean);
export function beginPursuit(){
 return {started:false,elapsed:0,remaining:chaseLimit,result:null,cars:patrolSpawns.map((p,i)=>({...p,id:'patrol-'+i,vehicle:0,health:patrolPerformance.hp,active:false,speed:0,points:[],next:0,replanAt:0,ramAt:-1}))};
}
function follow(car,player,dt){
 if(player.time>=car.replanAt){
  car.replanAt=player.time+.65+(Number(car.id.split('-')[1])%3)*.08;
  // Lead at road junctions; the route remains on the existing road graph.
  const lead=car.id.endsWith('0')?0:Math.min(160,Math.abs(player.speed)*.7);
  car.points=responseRoadPath(player.x+Math.cos(player.heading)*lead,player.y+Math.sin(player.heading)*lead,[car])?.points??[];
  car.next=car.points.length>1?1:0;
 }
 let budget=0;
 const next=car.points[car.next];if(!next){car.speed=Math.max(0,car.speed-patrolPerformance.brake*dt);return;}
 const angle=Math.atan2(next[1]-car.y,next[0]-car.x),turn=Math.abs(Math.atan2(Math.sin(angle-car.heading),Math.cos(angle-car.heading)));
 const target=patrolPerformance.max/(1+turn*patrolPerformance.corner);
 car.speed=clamp(target,Math.max(0,car.speed-patrolPerformance.brake*dt),car.speed+patrolPerformance.accel*dt);budget=car.speed*dt;
 while(budget>0&&car.next<car.points.length){
  const p=car.points[car.next],dx=p[0]-car.x,dy=p[1]-car.y,gap=Math.hypot(dx,dy);
  if(gap<.1){car.next++;continue;}
  const heading=Math.atan2(dy,dx),advance=Math.min(gap,budget),x=car.x+dx/gap*advance,y=car.y+dy/gap*advance;
  const gate=crossings.some(c=>Math.abs(x-c.x)<c.w/2&&Math.abs(y-c.y)<63&&Math.abs(y-c.y)<Math.abs(car.y-c.y)&&Math.abs(Math.sin(heading))>.6&&crossingActive(c,player.time));
  if(gate||blocked(x,y,8,player)){car.speed=0;car.replanAt=Math.min(car.replanAt,player.time+.15);return;}
  if(player.z+(player.deck??0)<15&&Math.hypot(x-player.x,y-player.y)<29){collideWithPatrol(player,car);car.speed=0;return;}
  Object.assign(car,{x,y,heading});budget-=advance;
  if(advance>=gap)car.next++;
 }
}
export function updatePursuit(pursuit,player,dt){
 if(pursuit.result)return null;
 if(player.broken){pursuit.result='broken';return 'broken';}
 if(!pursuit.started){
  if(Math.abs(player.speed)<4)return null;
  pursuit.started=true;return 'started';
 }
 pursuit.elapsed+=dt;pursuit.remaining=Math.max(0,chaseLimit-pursuit.elapsed);
 if(pursuit.remaining<=0){pursuit.result='timeout';return 'timeout';}
 if(player.z+(player.deck??0)<4&&Math.hypot(player.x-pursuitGoal.x,player.y-pursuitGoal.y)<pursuitGoal.radius){pursuit.result='escaped';return 'escaped';}
 for(const car of pursuit.cars){
  if(car.health<=0)continue;
  if(!car.active&&Math.hypot(car.x-player.x,car.y-player.y)<patrolPerformance.activation){car.active=true;car.replanAt=player.time;}
  if(car.active)follow(car,player,dt);
 }
 if(player.broken){pursuit.result='broken';return 'broken';}
 return null;
}
