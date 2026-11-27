import {sidewalkWidth} from './street-space.js?v=5.6.0';
import {railClearance} from './rail-layout.js?v=5.6.0';
import {world,pond,WEST_EDGE,SIZE} from './world.js?v=5.6.0';
import {segmentDistance} from './geometry.js?v=5.6.0';
import {crowdActivity} from './weather.js?v=5.6.0';
import {population,basePopulation} from './hero-life.js?v=5.6.0';
import {southWalks} from './south.js?v=5.6.0';
import {bodyOpacity} from './wreckage.js?v=5.6.0';
import {pedestrianSites,streetProps} from './frontages.js?v=5.6.0';
import {pedestrianIncidents} from './pedestrian-incidents.js?v=5.6.0';
import {blocked,isDestroyed,isRoad,roads} from './world.js?v=5.6.0';
import {intersectionCrossings,mayStartCrossing} from './signals.js?v=5.6.0';

const face=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
const at=(id,point,heading,pose,style)=>({id,x:point[0],y:point[1],heading,pose,style});

function walkingPath(points){
 let length=0;
 const segments=points.map((a,i)=>{
  const b=points[(i+1)%points.length],start=length;
  length+=Math.hypot(b[0]-a[0],b[1]-a[1]);
  return {a,b,start,end:length,heading:face(a,b)};
 });
 return {segments,length};
}
const paths=pedestrianSites.plazaWalks.map(walkingPath);
const benches=streetProps.filter(item=>item.id.startsWith('plaza-bench'));
const walkerOffset=[0,128,232,70,201];
const extraWalks=[
 ...southWalks,
 {id:'station-stroll',count:6,points:[[2028,1310],[2197,1310],[2197,1422],[2018,1422]]},
 {id:'station-shops-stroll',count:5,points:[[1752,1410],[1968,1410],[1968,1417],[1752,1417]]},
 {id:'east-station-shops',count:3,points:[[2385,1410],[2522,1410],[2522,1417],[2385,1417]]},
 {id:'station-south-shopping',count:9,points:[[1758,1490],[2192,1490],[2192,1487],[1758,1487]]},
 {id:'station-east-shopping',count:5,points:[[2310,1490],[2530,1490],[2530,1487],[2310,1487]]},
 {id:'park-stroll',count:5,points:[[688,2585],[888,2585],[888,2680],[688,2680]]},
 {id:'orchard-stroll',count:6,points:[[5292,2593],[5505,2610],[5608,2503],[5452,2411]]},
 {id:'west-stroll',count:6,points:[[-2580,2440],[-2510,2395],[-2410,2400],[-2350,2450],[-2470,2470]]},
].map(walk=>({...walk,path:walkingPath(walk.points)}));
const sidewalkWalks=roads.flatMap((r,index)=>{
 const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],length=Math.hypot(dx,dy);if(length<220||r.curve||r.park&&index%3!==0)return [];
 const c=dx/length,n=dy/length,offset=r.w/2+sidewalkWidth(r)*.55;
 return [-1,1].flatMap(side=>{
  const runs=[];let start=null,last=null;
  const finish=()=>{if(start&&last&&Math.hypot(last[0]-start[0],last[1]-start[1])>48)runs.push([start,last]);start=null;last=null;};
  for(let at=22;at<length-22;at+=8){const point=[r.a[0]+c*at-n*offset*side,r.a[1]+n*at+c*offset*side];if(!isRoad(...point,5)&&!blocked(...point,8)){start??=point;last=point;}else finish();}finish();
  return runs.map((points,i)=>({id:'sidewalk-'+index+'-'+side+'-'+i,count:Math.max(1,Math.min(7,Math.ceil(Math.hypot(points[1][0]-points[0][0],points[1][1]-points[0][1])/200))),path:walkingPath(points)}));
 });
});

export const vacantWalks=[];
for(let y=440;y<SIZE.h-230;y+=360)for(let x=WEST_EDGE+240;x<SIZE.w-230;x+=360){
 const points=[[x-40,y-32],[x+40,y-32],[x+40,y+32],[x-40,y+32]],gap=Math.min(...roads.map(r=>segmentDistance(x,y,r)-r.w/2));
 if(gap<65||gap>280||world.buildings.some(b=>Math.abs(b.x-x)<b.w/2+70&&Math.abs(b.y-y)<b.d/2+62))continue;
 const clear=points.every((a,i)=>{const b=points[(i+1)%4];return Array.from({length:12},(_,j)=>{const t=j/11,px=a[0]+(b[0]-a[0])*t,py=a[1]+(b[1]-a[1])*t;return !pond(px,py)&&!isRoad(px,py,10)&&!blocked(px,py,7)&&!railClearance(px,py,24,500);}).every(Boolean);});
 if(clear)vacantWalks.push({id:'vacant-stroll-'+vacantWalks.length,count:3,path:walkingPath(points),points});
}

function southernCrossing(id,a,b,fraction,first){
 const angle=face(a,b),c=Math.cos(angle),n=Math.sin(angle);
 const center=a.map((v,i)=>v+(b[i]-v)*fraction);
 return {id,center,angle,width:76,first,interval:30,person:2,
  ends:[-50,50].map(d=>[center[0]-n*d,center[1]+c*d])};
}
const newCrossings=[
 southernCrossing('apricot-crosswalk',[-1770,4350],[-700,4570],.31,18),
 southernCrossing('hill-crosswalk',[5200,4410],[6070,4770],.51,23)
];


export function createPedestrians(time=0){
 return {
  people:[],
  crossings:[...pedestrianSites.crossings,...intersectionCrossings,...newCrossings].map(spec=>({
   ...spec,phase:'idle',side:0,progress:0,nextAt:spec.first===undefined?Infinity:time+spec.first
  }))
 };
}

export function crossingCoordinates(crossing,body){
 const dx=body.x-crossing.center[0],dy=body.y-crossing.center[1];
 const cos=Math.cos(crossing.angle),sin=Math.sin(crossing.angle);
 return {along:dx*cos+dy*sin,across:dy*cos-dx*sin,direction:Math.cos(body.heading-crossing.angle)};
}

export const markedCrossings=[...pedestrianSites.crossings,...intersectionCrossings,...newCrossings];

function onCrossing(crossing,body){
 const p=crossingCoordinates(crossing,body);
 return Math.abs(p.along)<24&&Math.abs(p.across)<crossing.width/2+8;
}

const avoidanceRadius=100, returnTime=1.6;
const detours=[0,Math.PI/3,-Math.PI/3,Math.PI*5/9,-Math.PI*5/9];

function moveAroundIncident(person,incidents,player,time){
 let nearest=null,distance=avoidanceRadius;
 for(const incident of incidents){
  const gap=Math.hypot(incident.x-person.x,incident.y-person.y);
  if(gap<distance){distance=gap;nearest=incident;}
 }
 if(!nearest)return person;
 const strength=Math.max(0,Math.min(1,(time-nearest.hitAt)/.9,(nearest.fallenUntil+returnTime-time)/returnTime));
 const offset=Math.min(62,avoidanceRadius+12-distance)*strength;
 if(offset<.3)return person;
 const away=distance<.001?person.heading+Math.PI/2:face([nearest.x,nearest.y],[person.x,person.y]);
 const onRoad=isRoad(person.x,person.y,-5);
 for(const amount of [offset,offset*.45]){
  for(const turn of detours){
   const direction=away+turn,c=Math.cos(direction),n=Math.sin(direction);
   const clear=[1/3,2/3,1].every(fraction=>{
    const x=person.x+c*amount*fraction,y=person.y+n*amount*fraction;
    return !blocked(x,y,4,player)&&(onRoad||!isRoad(x,y,-5));
   });
   if(clear)return {...person,x:person.x+c*amount,y:person.y+n*amount,heading:direction,pose:Math.floor(time*7)%2?'walk-a':'walk-b'};
  }
 }
 return {...person,heading:away,pose:'stand'};
}

export function updatePedestrians(crowd,cars,player,time,dt){
 const people=[],struck=player.struck,residents=player.hero?population(player):basePopulation,densityScale=Math.min(1.4,Math.max(.7,residents/basePopulation));
 if(struck)for(const [id,record] of struck)if(record.recoverAt<=time)struck.delete(id);
 const incidents=pedestrianIncidents(player,time,returnTime);
 const vehicles=cars.filter(car=>bodyOpacity(car,time)>0);
 for(const [i,chat] of pedestrianSites.chats.entries()){
  for(const [j,point] of chat.points.entries()){
   if(blocked(...point,2,player))continue;
   const gesture=Math.sin(time*(1.15+i*.11)+i*3+j*2.4)>.60;
   people.push(at(chat.id+'-'+j,point,face(point,chat.points[1-j]),gesture?'gesture':'stand',i+j));
  }
 }
 for(const [i,bench] of benches.entries()){
  if(isDestroyed(player,bench.id))continue;
  const [x,y]=bench.position;
  people.push(at(bench.id+'-person',[x+(i%2?3:-4),y+2],Math.PI/2,'sit',i+2));
 }
 for(const [i,offset] of walkerOffset.entries()){
  const path=paths[i<3?0:1],distance=(time*(13+i%3*2)+offset)%path.length;
  const segment=path.segments.find(line=>distance<line.end);
  const t=(distance-segment.start)/(segment.end-segment.start);
  const point=segment.a.map((value,k)=>value+(segment.b[k]-value)*t);
  if(!blocked(...point,2,player))people.push(at('plaza-walk-'+i,point,segment.heading,i%2?'walk-a':'walk-b',i));
 }
 for(const {id,count,path} of [...extraWalks,...sidewalkWalks,...vacantWalks])for(let i=0;i<Math.ceil(count*densityScale);i++){
  const distance=(time*(13+i%3*2)+path.length*i/count)%path.length;
  const segment=path.segments.find(line=>distance<line.end);
  const t=(distance-segment.start)/(segment.end-segment.start);
  const point=segment.a.map((value,k)=>value+(segment.b[k]-value)*t);
  if(id.startsWith('sidewalk-')||!blocked(...point,4,player))people.push(at(id+'-'+i,point,segment.heading,Math.floor(time*5+i)%2?'walk-a':'walk-b',(i+id.length)%8));
 }
 for(const crossing of crowd.crossings){
  const casualty=struck?.get(crossing.id+'-person');
  if(casualty){
   crossing.phase='idle';crossing.progress=0;if(Number.isFinite(casualty.recoverAt))crossing.nextAt=Math.max(crossing.nextAt,casualty.recoverAt+2);
   continue;
  }
  if(crossing.phase==='idle'&&time>=crossing.nextAt){const density=crowdActivity(player);if(player.hero&&((Math.floor(time/12)+crossing.id.length*17)%100)/100>density){crossing.nextAt=time+12;continue;}crossing.phase='waiting';}
  const junctionClearing=crossing.junction&&vehicles.some(car=>
   Math.hypot(car.x-crossing.junction[0],car.y-crossing.junction[1])<94);
  const incidentAtCrossing=incidents.some(incident=>time<incident.fallenUntil&&
   Math.hypot(incident.x-crossing.center[0],incident.y-crossing.center[1])<avoidanceRadius);
  if(crossing.phase==='waiting'&&!incidentAtCrossing&&mayStartCrossing(crossing,time)&&!junctionClearing&&
     !vehicles.some(car=>onCrossing(crossing,car))&&
     !(player.z<10&&bodyOpacity(player,time)>0&&onCrossing(crossing,player))){
   crossing.phase='walking';
   crossing.progress=0;
  }
  if(crossing.phase==='idle')continue;
  const start=crossing.ends[crossing.side],end=crossing.ends[1-crossing.side];
  if(crossing.phase==='walking')crossing.progress+=dt*21/(crossing.length??crossing.width+24);
  if(crossing.progress>=1){
   crossing.phase='idle';
   crossing.nextAt=time+crossing.interval;
   crossing.side=1-crossing.side;
   crossing.progress=0;
   continue;
  }
  const point=start.map((v,i)=>v+(end[i]-v)*crossing.progress);
  const walk=crossing.phase==='walking';
  const pose=walk&&Math.floor(time*5)%2===0?'walk-a':walk?'walk-b':'stand';
  people.push(at(crossing.id+'-person',point,face(start,end),pose,crossing.person));
 }
 const visible=struck?.size?people.filter(person=>!struck.has(person.id)):people;
 const ratio=player.hero?Math.min(1,residents/basePopulation):1;crowd.densityKeys??=new Map();
 const activity=crowdActivity(player);const occupied=ratio>=1&&activity>=1?visible:visible.filter(p=>{if(!crowd.densityKeys.has(p.id)){let h=0;for(const c of p.id)h=(h*31+c.charCodeAt(0))>>>0;crowd.densityKeys.set(p.id,(h%10000)/10000);}return crowd.densityKeys.get(p.id)<ratio*(crowd.crossings.some(c=>p.id===c.id+'-person')?1:activity);});
 crowd.people=incidents.length?occupied.map(person=>moveAroundIncident(person,incidents,player,time)):occupied;
}
