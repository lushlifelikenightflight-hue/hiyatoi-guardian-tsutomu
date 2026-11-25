import {blocked,crossings,responseRoadPath,serviceBays} from './world.js?v=5.3.0';
import {crossingActive} from './railway.js?v=5.3.0';
import {bodyOpacity} from './wreckage.js?v=5.3.0';

function route(points){
 let length=0;
 const sections=points.slice(1).map((b,i)=>{
  const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1],start=length;
  length+=Math.hypot(dx,dy);
  return {a,dx,dy,start,end:length,heading:Math.atan2(dy,dx)};
 });
 return {length,sections};
}

function pose(path,distance){
 const segment=path.sections.find(s=>distance<s.end)??path.sections.at(-1);
 const t=(distance-segment.start)/(segment.end-segment.start);
 return {x:segment.a[0]+segment.dx*t,y:segment.a[1]+segment.dy*t,heading:segment.heading};
}

export function dispatchAmbulance(player,person){
 player.responses??=[];
 const depots=serviceBays.filter(b=>Math.hypot(person.x-b.x,person.y-b.y)>165);
 const leastBusy=depots.filter(b=>!player.responses.some(car=>car.depot===b));
 const response=responseRoadPath(person.x,person.y,leastBusy.length?leastBusy:depots);
 if(!response||response.points.length<2)return false;
 const path=route(response.points);
 const limit=path.length-Math.min(37,path.length*.25);
 person.fallenUntil=person.recoverAt=Infinity;
 player.responses.push({...pose(path,0),person,path,limit,points:response.points,depot:response.depot,
  id:'ambulance-'+person.id+'-'+player.time,vehicle:1,health:320,maxHealth:320,occupants:2,distance:0,speed:0,phase:'responding',readyAt:player.time+1.4});
 return true;
}

function hazardGap(car,obstacle,radius){
 const dx=obstacle.x-car.x,dy=obstacle.y-car.y,c=Math.cos(car.heading),s=Math.sin(car.heading);
 const along=dx*c+dy*s,across=Math.abs(dy*c-dx*s);
 return along>=0&&across<radius?Math.max(0,along-Math.sqrt(radius**2-across**2)):Infinity;
}

function drivingGap(car,player,cars){
 let gap=Infinity;
 if(player.z<15&&bodyOpacity(player,player.time)>0)gap=hazardGap(car,player,26);
 for(const other of cars){
  if(bodyOpacity(other,player.time)>0)gap=Math.min(gap,hazardGap(car,other,18));
 }
 for(const crossing of crossings){
  if(!crossingActive(crossing,player.time)||Math.abs(car.x-crossing.x)>crossing.w/2||
     Math.abs(Math.sin(car.heading))<.65)continue;
  if((crossing.y-car.y)*Math.sin(car.heading)>0&&Math.abs(car.y-crossing.y)>=59){
   gap=Math.min(gap,Math.max(0,(Math.abs(car.y-crossing.y)-62)/Math.abs(Math.sin(car.heading))));
  }
 }
 return gap;
}

export function updateAmbulances(player,cars,dt){
 if(!player.responses?.length)return;
 const time=player.time;
 for(const car of player.responses){
  if(car.health===0){car.speed=0;if(car.phase!=='disabled'){car.phase='disabled';car.person.fallenUntil=time+12;car.person.recoverAt=time+45;}continue;}
  if(time<car.readyAt)continue;
  if(car.phase==='loading'){
   const progress=Math.min(1,(time-car.loadAt)/5);
   if(progress>=.52&&car.person.fallenUntil===Infinity){
    car.person.fallenUntil=time;
    car.person.recoverAt=Infinity;
   }
   if(progress<1)continue;
   car.phase='transporting';
   car.path=route(car.returnPoints);
   car.limit=car.path.length;car.distance=0;
   Object.assign(car,pose(car.path,0));
  }
  if(car.phase==='done')continue;
  const gap=drivingGap(car,player,cars);
  const ahead=pose(car.path,Math.min(car.limit,car.distance+42));
  const turn=Math.abs(Math.sin(ahead.heading-car.heading));
  const remain=car.limit-car.distance;
  const allowed=Math.min(gap,remain);
  const target=Math.min(137*(1-turn*.64),Math.sqrt(allowed*170),allowed*4);
  car.speed=Math.max(0,Math.min(car.speed+65*dt,Math.max(car.speed-145*dt,target),allowed/dt));
  car.distance+=car.speed*dt;
  Object.assign(car,pose(car.path,car.distance));
  const canLoadFromHere=car.phase==='responding'&&remain<45&&gap<.5;
  if(remain>.35&&!canLoadFromHere)continue;
  car.speed=0;
  if(car.phase==='transporting'){
   car.phase='done';car.person.recoverAt=time+4;
  }else{
   const current=car.path.sections.findIndex(s=>car.distance<s.end);
   car.returnPoints=[[car.x,car.y],...car.points.slice(0,current+1).reverse()].filter((p,i,list)=>!
    i||Math.hypot(p[0]-list[i-1][0],p[1]-list[i-1][1])>.02);
   car.phase='loading';car.loadAt=time;
  }
 }
 player.responses=player.responses.filter(car=>car.phase!=='done'&&(car.health!==0||bodyOpacity(car,time)>0));
}

export function ambulanceVisible(car,time){
 return time>=car.readyAt&&car.phase!=='done'&&bodyOpacity(car,time)>0;
}

export function yieldForAmbulance(car,player,time){
 for(const rescue of player.responses??[]){
  if(rescue.health===0||!ambulanceVisible(rescue,time))continue;
  if(Math.hypot(car.x-rescue.x,car.y-rescue.y)>186)continue;
  // Only yield along the current/upcoming road, or very close to the vehicle.
  for(const advance of [0,32,64,96,128]){
   const point=pose(rescue.path,Math.min(rescue.limit,rescue.distance+advance));
   if(Math.hypot(car.x-point.x,car.y-point.y)<(advance===0?58:36))return true;
  }
 }
 return false;
}

export function roadsidePose(point,amount,player){
 if(!amount)return point;
 const c=Math.cos(point.heading),s=Math.sin(point.heading);
 for(const offset of [amount,amount*.6,amount*.3]){
  const x=point.x+s*offset,y=point.y-c*offset;
  if(!blocked(x,y,9,player))return {...point,x,y,offset};
 }
 return point;
}

export function stretcherAt(car,time){
 if(car.phase!=='loading')return null;
 const progress=Math.min(1,(time-car.loadAt)/5);
 if(progress>=.95)return null;
 const t=progress<.52?progress/.52:(1-progress)/.48;
 const x=car.x-Math.cos(car.heading)*17,y=car.y-Math.sin(car.heading)*17;
 return {x:x+(car.person.x-x)*t,y:y+(car.person.y-y)*t,
  heading:Math.atan2(car.person.y-y,car.person.x-x)+(progress<.52?0:Math.PI),
  loaded:progress>=.52,style:car.person.style};
}
