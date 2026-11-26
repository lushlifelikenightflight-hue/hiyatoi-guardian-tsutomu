import {civicLight,civicSignals} from './city-upgrade.js?v=5.4.0';
import {roadsidePose,yieldForAmbulance} from './ambulance.js?v=5.4.0';
import {southTraffic} from './south.js?v=5.4.0';
import {pedestrianIncidents} from './pedestrian-incidents.js?v=5.4.0';
import {bodyOpacity} from './wreckage.js?v=5.4.0';
import {districtTraffic,sideStreetTraffic,turningTraffic} from './districts.js?v=5.4.0';
import {segmentDistance} from './geometry.js?v=5.4.0';
import {crossingCoordinates} from './pedestrians.js?v=5.4.0';
import {avenueJunction,signalState} from './signals.js?v=5.4.0';
import {crossings} from './world.js?v=5.4.0';
import {crossingActive} from './railway.js?v=5.4.0';

// Each itinerary lies on the authored network. Offset to the left in the
// direction of travel, and round the lane joins inside the intersection.
const centralCourse={points:[[580,910],[1700,910],[1700,1460],[580,1460]],alleys:[],outer:true};
const plans=[centralCourse,...districtTraffic,sideStreetTraffic,...turningTraffic,...southTraffic];
const bodies=[
 {span:7,radius:7,health:85,mass:1.1},
 {span:9,radius:7,health:115,mass:1.8},
 {span:11,radius:8,health:170,mass:3.2},
 {span:4,radius:5,health:50,mass:.48}
];
const bumpers=(car)=>bodies[car.vehicle].span+bodies[car.vehicle].radius;
export const queueSpacing=(car,leader)=>bumpers(car)+bumpers(leader)+10;
const mix=(a,b,t)=>a+(b-a)*t;
const unit=(a,b)=>{
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
 return [(b[0]-a[0])/length,(b[1]-a[1])/length];
};
function lane(points,alleys,outer){
 const polyline=[];
 const corners=[];
 for(let i=0;i<points.length;i++){
  const b=points[i],incoming=unit(points.at(i-1),b),outgoing=unit(b,points[(i+1)%points.length]);
  const offset=(index,start,end)=>outer&&start[1]===910&&end[1]===910?43:alleys.includes(index)?10:14;
  const arrive=offset((i+points.length-1)%points.length,points.at(i-1),b);
  const depart=offset(i,b,points[(i+1)%points.length]);
  const rounding=25;
  const entry=[b[0]+incoming[1]*arrive-incoming[0]*rounding,b[1]-incoming[0]*arrive-incoming[1]*rounding];
  const exit=[b[0]+outgoing[1]*depart+outgoing[0]*rounding,b[1]-outgoing[0]*depart+outgoing[1]*rounding];
  const corner=[b[0]+(incoming[1]*arrive+outgoing[1]*depart)/2,b[1]-(incoming[0]*arrive+outgoing[0]*depart)/2];
  const cross=incoming[0]*outgoing[1]-incoming[1]*outgoing[0];
  if(b[0]===avenueJunction[0]&&b[1]===avenueJunction[1]&&Math.abs(cross)>.38){
   corners.push({entry:polyline.length,exit:polyline.length+8,side:cross>0?'right':'left'});
  }
  for(let j=0;j<=8;j++){
   const t=j/8;
   polyline.push(entry.map((v,k)=>mix(mix(v,corner[k],t),mix(corner[k],exit[k],t),t)));
  }
 }
 let length=0;
 const segments=polyline.map((a,i)=>{
  const b=polyline[(i+1)%polyline.length],start=length;
  length+=Math.hypot(b[0]-a[0],b[1]-a[1]);
  return {a,b,start,end:length,heading:Math.atan2(b[1]-a[1],b[0]-a[0])};
 });
 const turns=corners.map(c=>({start:segments[c.entry].start,end:segments[c.exit].start,side:c.side}));
 return {segments,length,turns,narrow:alleys.map(i=>({a:points[i],b:points[(i+1)%points.length]}))};
}
const routes=plans.flatMap(({points,alleys,count,outer})=>[
 {...lane(points,alleys,outer),count},
 {...lane(points.slice().reverse(),alleys.map(i=>(2*points.length-2-i)%points.length),outer),count}
]);
function pose(route,distance){
 const d=distance%route.length;
 const segment=route.segments.find(s=>d<s.end)??route.segments.at(-1);
 const t=(d-segment.start)/(segment.end-segment.start);
 return {x:mix(segment.a[0],segment.b[0],t),y:mix(segment.a[1],segment.b[1],t),heading:segment.heading};
}
export function createTraffic(player){
 return routes.flatMap((route,index)=>Array.from({length:Math.max(1,Math.round((route.count??(index<2?2:3))*(player?.hero?.city?.traffic??1)))},(_,i)=>{
  let distance=route.length*(i+(index%2?.62:.31))/(route.count??(index<2?2:3));
  const initial=pose(route,distance);
  if(player&&Math.hypot(initial.x-player.x,initial.y-player.y)<65)distance=(distance+115)%route.length;
  const vehicle=index>=2&&i===2?3:(index+i)%2;
  return {id:'traffic-'+index+'-'+i,route,distance,speed:0,max:49+(index*13+i*7)%24,
   vehicle,health:bodies[vehicle].health,signal:null, ...pose(route,distance)};
 }));
}

function gapAhead(car,other,look){
 const dx=other.x-car.x,dy=other.y-car.y;
 if(Math.abs(dx)>look+15||Math.abs(dy)>look+15)return Infinity;
 const ahead=dx*Math.cos(car.heading)+dy*Math.sin(car.heading);
 const side=-dx*Math.sin(car.heading)+dy*Math.cos(car.heading);
 return ahead>0&&Math.abs(side)<16 ? ahead : Infinity;
}

function nextTurn(car){
 for(const turn of car.route.turns){
  if(car.distance>=turn.start&&car.distance<=turn.end)return turn.side;
  const ahead=(turn.start-car.distance+car.route.length)%car.route.length;
  if(ahead<133)return turn.side;
 }
 return null;
}

export function damageTraffic(car,amount,time){
 const wasRunning=(car.health??bodies[car.vehicle].health)>0;
 car.health=Math.max(0,(car.health??bodies[car.vehicle].health)-amount);
 if(wasRunning&&car.health===0){
  car.speed=0;
  car.signal=null;
  car.wreckedAt=time;
 }
}

function contactWithCar(car,other,time,speed){
 const closing=Math.hypot(
  Math.cos(car.heading)*speed-Math.cos(other.heading)*other.speed,
  Math.sin(car.heading)*speed-Math.sin(other.heading)*other.speed
 );
 if(closing<22||(car.crashUntil??0)>time||(other.crashUntil??0)>time)return;
 car.crashUntil=other.crashUntil=time+.65;
 damageTraffic(car,closing**2*.0025*bodies[other.vehicle].mass,time);
 damageTraffic(other,closing**2*.0025*bodies[car.vehicle].mass,time);
}

const incidentRadius=68;

function gapToIncident(car,incidents,look){
 let closest=Infinity;
 for(const incident of incidents){
  const distance=Math.hypot(car.x-incident.x,car.y-incident.y);
  if(distance<=incidentRadius)return 0;
  if(distance-incidentRadius>look)continue;
  // Follow road geometry around bends instead of looking through the next corner.
  for(let previous=0;previous<Math.min(look,closest);){
   const sample=Math.min(look,closest,previous+14);
   const point=pose(car.route,car.distance+sample);
   if(Math.hypot(point.x-incident.x,point.y-incident.y)<=incidentRadius){
    let lo=previous,hi=sample;
    for(let i=0;i<6;i++){
     const middle=(lo+hi)/2,next=pose(car.route,car.distance+middle);
     if(Math.hypot(next.x-incident.x,next.y-incident.y)>incidentRadius)lo=middle;
     else hi=middle;
    }
    closest=lo;
    break;
   }
   previous=sample;
  }
 }
 return closest;
}

export function updateTraffic(cars,player,time,dt,pedestrianCrossings=[],playerImpact){
 const incidents=pedestrianIncidents(player,time);
 const trajectories=new Map(cars.filter(c=>c.health!==0).map(c=>[c,Array.from({length:8},(_,i)=>pose(c.route,c.distance+i*14))]));
 const closed=crossings.filter(c=>crossingActive(c,time));
 const playerOnRoad=player.z<17&&bodyOpacity(player,time)>0;
 for(const [index,car] of cars.entries()){
  if(car.health===0){
   car.incidentBraking=false;car.yieldOffset=0;car.yielding=false;
   // Keep the fleet populated by returning a replacement away from the player.
   if(time-car.wreckedAt<24)continue;
   const distance=(car.distance+450)%car.route.length,next=pose(car.route,distance);
   if(Math.hypot(next.x-player.x,next.y-player.y)<180||cars.some(other=>other!==car&&bodyOpacity(other,time)>0&&Math.hypot(next.x-other.x,next.y-other.y)<52))continue;
   Object.assign(car,next,{distance,speed:0,health:bodies[car.vehicle].health,wreckedAt:null,citizensLost:false,monsterContactAt:undefined});
  }
  car.yielding=yieldForAmbulance(car,player,time);
  car.signal=car.yielding?'left':nextTurn(car);
  const ahead=pose(car.route,car.distance+28);
  const bend=Math.abs(Math.sin(ahead.heading-car.heading));
  const narrow=car.route.narrow.some(r=>segmentDistance(ahead.x,ahead.y,r)<14);
  let target=(narrow?Math.min(car.max,41):car.max)*(1-bend*.62);
  const look=57+car.speed*.84;
  const inSignalQueue=pedestrianCrossings.some(c=>{
   if(!c.group)return false;
   const position=crossingCoordinates(c,car);
   return position.along>=24&&position.along<340&&position.direction<-.90&&Math.abs(position.across)<c.width/2;
  });
  let queueGap=Infinity,blocker=null;
  for(const other of cars){
   if(other===car||bodyOpacity(other,time)===0)continue;
   const gap=gapAhead(car,other,36+car.speed*.73),following=Math.cos(car.heading-other.heading)>.65;
   if(following&&Number.isFinite(gap)){const limited=Math.max(0,(gap-25)*2);if(limited<target){target=limited;blocker=other;}}
   if(inSignalQueue&&Math.cos(car.heading-other.heading)>.90){
    queueGap=Math.min(queueGap,gapAhead(car,other,look)-queueSpacing(car,other));
   }
  }
  queueGap=Math.max(0,queueGap);
  target=Math.min(target,Math.sqrt(queueGap*2*105),queueGap*2.4);
  if(playerOnRoad)target=Math.min(target,Math.max(0,(gapAhead(car,player,look)-27)*2));
  for(const c of closed){
   const gap=Math.abs(car.y-c.y)-88;
   if(gap>=-3&&Math.abs(car.x-c.x)<c.w/2&&Math.abs(Math.sin(car.heading))>.65&&
      (c.y-car.y)*Math.sin(car.heading)>0)target=Math.min(target,Math.max(0,gap*3));
  }
  const incidentGap=incidents.length?gapToIncident(car,incidents,look):Infinity;
  car.incidentBraking=Number.isFinite(incidentGap);
  let stopGap=incidentGap;
  for(const signal of civicSignals){
   if(Math.abs(car.x-signal.x)>220||Math.abs(car.y-signal.y)>220)continue;
   for(const [dx,dy] of signal.arms){
    const len=Math.hypot(dx,dy),x=car.x-signal.x,y=car.y-signal.y;
    const along=(x*dx+y*dy)/len,across=(y*dx-x*dy)/len;
    const correctDirection=(Math.cos(car.heading)*dx+Math.sin(car.heading)*dy)/len<-.88;
    if(!correctDirection||along<51||Math.abs(across)>50)continue;
    const light=civicLight(signal,Math.abs(dx)>=Math.abs(dy)?0:1,time),gap=along-54;
    if(light==='red'||light==='yellow'&&gap>car.speed**2/(2*105))stopGap=Math.min(stopGap,Math.max(0,gap));
   }
  }
  for(const crossing of pedestrianCrossings){
   const {along,across,direction}=crossingCoordinates(crossing,car);
   if(Math.abs(across)>crossing.width/2+4||Math.abs(direction)<.82||along*direction>=0)continue;
   if(crossing.group){
    const inbound=direction<0;
    const light=signalState(crossing.group,time).vehicle;
    const yellowCanStop=along-28>=car.speed**2/(2*105);
    const red=inbound&&(light==='red'||(light==='yellow'&&yellowCanStop));
    if(crossing.phase!=='walking'&&(!red||along<24))continue;
    stopGap=Math.min(stopGap,Math.max(0,Math.abs(along)-28));
    continue;
   }
   if(crossing.phase==='idle')continue;
   // While waiting, let cars already past the stop line clear the stripes.
   if(crossing.phase==='waiting'&&Math.abs(along)<24)continue;
   stopGap=Math.min(stopGap,Math.max(0,Math.abs(along)-28));
  }
  // Look around the actual bend, not through the corner. The first arriving
  // car clears the conflict before the next one enters its swept path.
  for(const other of cars){
   if(other===car||other.health===0||Math.hypot(car.x-other.x,car.y-other.y)>190||Math.cos(car.heading-other.heading)>.8)continue;
   const a=trajectories.get(car),b=trajectories.get(other);if(!a||!b)continue;
   let conflict=null;
   for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
    if(Math.hypot(a[i].x-b[j].x,a[i].y-b[j].y)<19&&(!conflict||i+j<conflict.i+conflict.j))conflict={i,j};
   }
   if(!conflict)continue;
   const {i,j}=conflict;
   if(j<i||j===i&&other.id.localeCompare(car.id)<0){const gap=Math.max(0,i*14-32);if(gap<stopGap){stopGap=gap;blocker=other;}}
  }
  if(car.yielding)target=0;
  target=Math.min(target,Math.sqrt(stopGap*2*95),stopGap*3);
  // Yield before a crossing trajectory. A vehicle already in the conflict
  // area keeps moving so a waiting vehicle cannot trap it in the junction.
  const future=pose(car.route,car.distance+46);
  const projected=playerOnRoad?gapAhead(car,player,look):Infinity;
  if(projected<27)target=0;
  for(let i=0;i<index;i++){
   const other=cars[i];
   if(bodyOpacity(other,time)===0||Math.hypot(car.x-other.x,car.y-other.y)>98||Math.abs(Math.sin(car.heading-other.heading))<.55)continue;
   const otherFuture=pose(other.route,other.distance+46);
   if(Math.hypot(future.x-otherFuture.x,future.y-otherFuture.y)<32&&
      Math.hypot(car.x-otherFuture.x,car.y-otherFuture.y)>30)target=Math.min(target,7);
  }
  car.stopGap=stopGap;car.speed+=Math.max(-160*dt,Math.min(39*dt,target-car.speed));
  const allowedGap=Math.min(stopGap,queueGap);
  car.speed=allowedGap<.4?0:Math.min(car.speed,allowedGap/dt);
  const roadPoint=pose(car.route,car.distance+car.speed*dt);
  const offset=car.yieldOffset??0,end=car.yielding?13:0;
  const desired=offset+Math.max(-19*dt,Math.min(19*dt,end-offset));
  const next=roadsidePose(roadPoint,desired,player);
  const contacted=cars.find(other=>other!==car&&bodyOpacity(other,time)>0&&trafficOverlap(next,other)&&!(trafficOverlap(car,other)&&bodyGap(next,other)>bodyGap(car,other)+.00001));
  const playerClose=playerOnRoad&&Math.hypot(next.x-player.x,next.y-player.y)<20;
  if(contacted||playerClose){
   if(contacted)contactWithCar(car,contacted,time,car.speed);
   if(playerClose)playerImpact?.(car);
   car.speed=0;
   car.blockedBy=contacted?.id;car.stuckFor=(car.stuckFor??0)+dt;
   recoverTraffic(car,cars,player,time,dt,stopGap);
   continue;
  }
  car.blockedBy=car.speed<.5?blocker?.id:null;
  car.stuckFor=car.speed<.5?(car.stuckFor??0)+dt:0;
  if(car.speed<.5&&recoverTraffic(car,cars,player,time,dt,stopGap))continue;
  car.distance=(car.distance+car.speed*dt)%car.route.length;
  Object.assign(car,next,{yieldOffset:next.offset??0});
 }
}

function bodyGap(a,b){let gap=Infinity;const ax=Math.cos(a.heading),ay=Math.sin(a.heading),bx=Math.cos(b.heading),by=Math.sin(b.heading);for(const i of [-6,0,6])for(const j of [-6,0,6])gap=Math.min(gap,Math.hypot(a.x+ax*i-b.x-bx*j,a.y+ay*i-b.y-by*j));return gap;}
function recoverTraffic(car,cars,player,time,dt,stopGap){
 if((car.stuckFor??0)<3||car.yielding||car.incidentBraking||stopGap<2)return false;
 const cycle=[car];let next=cars.find(c=>c.id===car.blockedBy);
 while(next&&!cycle.includes(next)&&cycle.length<=cars.length){cycle.push(next);next=cars.find(c=>c.id===next.blockedBy);}
 const circular=next===car;
 if(!car.backingUntil&&(!circular||cycle.some(c=>c.id.localeCompare(car.id)>0)))return false;
 car.backingUntil??=time+3;
 if(time>car.backingUntil){car.backingUntil=null;car.stuckFor=0;return false;}
 const distance=(car.distance-13*dt+car.route.length)%car.route.length,point=pose(car.route,distance);
 if(Math.hypot(point.x-player.x,point.y-player.y)<28)return false;
 if(cars.some(other=>other!==car&&bodyOpacity(other,time)>0&&trafficOverlap(point,other)&&bodyGap(point,other)<=bodyGap(car,other)+.00001))return false;
 Object.assign(car,point,{distance,speed:0,yieldOffset:0,reversing:true});car.recoveryMoves=(car.recoveryMoves??0)+1;return true;
}

// Two narrow lanes have enough lateral clearance even when cars meet.
function trafficOverlap(a,b){
 if(Math.abs(a.x-b.x)>26||Math.abs(a.y-b.y)>26)return false;
 const ax=Math.cos(a.heading),ay=Math.sin(a.heading),bx=Math.cos(b.heading),by=Math.sin(b.heading);
 for(const i of [-6,0,6])for(const j of [-6,0,6]){
  if(Math.hypot(a.x+ax*i-b.x-bx*j,a.y+ay*i-b.y-by*j)<14)return true;
 }
 return false;
}

function overlapsCar(car,x,y,r){
 const dx=x-car.x,dy=y-car.y;
 if(Math.abs(dx)>r+20||Math.abs(dy)>r+20)return false;
 const c=Math.cos(car.heading),n=Math.sin(car.heading),body=bodies[car.vehicle];
 const along=dx*c+dy*n,side=-dx*n+dy*c;
 return Math.hypot(Math.max(0,Math.abs(along)-body.span),side)<r+body.radius;
}

export function trafficObstacle(cars,x,y,r,time){
 return trafficContact(cars,[[x,y]],r,time);
}
export function trafficContact(cars,proposed,r,time,escape){
 for(const car of cars??[]){
  if(bodyOpacity(car,time)===0||!proposed.some(([x,y])=>overlapsCar(car,x,y,r)))continue;
  if(escape){
   const {from,to,previous}=escape;
   const dx=to[0]-from[0],dy=to[1]-from[1];
   const opensGap=(from[0]-car.x)*dx+(from[1]-car.y)*dy+(dx*dx+dy*dy)/2>0;
   if(opensGap&&previous.some(([x,y])=>overlapsCar(car,x,y,r)))continue;
  }
  return {id:car.id,kind:'traffic',x:car.x,y:car.y,car};
 }
 return null;
}
