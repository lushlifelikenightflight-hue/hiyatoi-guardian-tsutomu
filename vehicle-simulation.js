import {cityArmor,harmCitizen} from './city-evolution.js?v=5.3.0';
import {recordDemolition} from './robot-progress.js?v=5.3.0';
import {weatherHandling} from './weather.js?v=5.3.0';
import {newHero,validHero,restoreHero} from './hero-life.js?v=5.3.0';
import {railSurface,updateRailSurface} from './rail-drive.js?v=5.3.0';
import {validJobHistory} from './job-contracts.js?v=5.3.0';
import {groundHeight,roadGrade} from './elevation.js?v=5.3.0';
import {FALLEN_DURATION,RECOVERY_DELAY} from './pedestrian-incidents.js?v=5.3.0';
import {segmentDistance} from './geometry.js?v=5.3.0';
import {ambulanceVisible} from './ambulance.js?v=5.3.0';
import {trafficContact,damageTraffic} from './traffic.js?v=5.3.0';
import {blocked,isRoad,SPAWN,GARAGE,SIZE,WEST_EDGE,crossings,roads,spots,world,nearby,boundaryBlocked,pond,objectHits,isDestroyed,surfaces,serviceBays,SERVICE_RADIUS,civicSites} from './world.js?v=5.3.0';
import {trainsAt,trainInView,crossingActive,crossingFor} from './railway.js?v=5.3.0';
import {vehicles} from './vehicle-specs.js?v=5.3.0';
import {vehicleStats,newUpgrades,validUpgrades} from './upgrades.js?v=5.3.0';
export {vehicles,vehicleStats};
const legacyHP=[195,292.5,495,112.5,153];
function savedMaximum(version,index,data){return version>=8?vehicleStats(data,index).hp:version>=7?vehicles[index].hp:legacyHP[index]/(version<6?1.5:1);}
const savedSlots=version=>version>=13?vehicles.length:version>=12?10:version>=7?7:version===5||version===6?5:4;
const repairPoints=[...serviceBays,{...GARAGE,id:'garage',name:'西町ガレージ'},...civicSites.filter(p=>['home','workshop'].includes(p.type))];
export function recoverySites(s){
 return serviceBays.slice().sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
}
export function createState(saved=null){return {x:saved?.x??SPAWN.x,y:saved?.y??SPAWN.y,heading:saved?.heading??SPAWN.heading,vx:0,vy:0,speed:0,z:0,vz:0,deck:0,surface:'ground',airSpeedLimit:undefined,vehicle:saved?.vehicle??0,distance:saved?.distance??0,collected:new Set(saved?.collected??[]),health:vehicles.map((v,i)=>saved?.health?.[i]??vehicleStats(saved??{},i).hp),upgrades:saved?.upgrades?.map(row=>row.slice())??newUpgrades(),damage:Object.assign(Object.create(null),saved?.damage??{}),time:saved?.time??0,pedestrianHits:saved?.pedestrianHits??0,points:saved?.points??0,jobHistory:structuredClone(saved?.jobHistory??[]),hero:restoreHero(saved?.hero),robotGaitPhase:0,robotAimAt:undefined,robotAimUntil:undefined,robotRiflePending:false,robotSwingAt:undefined,robotSwingHit:false,robotSwingTargets:[],robotShotAt:undefined,robotHurtAt:undefined,robotWindupAt:undefined,robotAttackAt:undefined,robotAction:undefined,weaponTraceCache:null,weaponTraceRevision:0,pendingVehicleTalks:(saved?.hero?.owned??[]).flatMap((owned,i)=>owned&&!(saved?.hero?.vehicleTalks??[0,1]).includes(i)?[i]:[]),totalDamage:0,workAuto:false,work:null,jobEffect:null,workReceipt:null,combatEffects:[],weatherHazards:[],weatherHazardKind:null,nextWeatherHazard:null,lastWeaponEffect:-1,attackBeam:null,weaponFlash:0,weaponCooldown:0,serviceGuide:null,struck:new Map(),responses:[],trial:null,pursuit:null,collisions:0,trainHits:0,jumps:0,boosts:0,maxZ:0,destroyedCount:0,safe:{...SPAWN},driveTime:0,boost:0,invulnerable:2,contactCooldown:Object.create(null),surfaceCooldown:Object.create(null),events:[],broken:(saved?.health?.[saved?.vehicle??0]??vehicles[saved?.vehicle??0].hp)<=0,repairTime:0,repairSite:null};}
function emit(s,type,data={}){if(s.events.length>=128)s.events.shift();s.events.push({type,x:s.x,y:s.y,z:s.z,time:s.time,...data});}
export function destroyedCount(s){let n=0;for(const id of Object.keys(s.damage))if(isDestroyed(s,id))n++;return n;}
function samples(s,x,y,vehicle=s.vehicle){const v=vehicles[vehicle],dx=Math.cos(s.heading)*v.span,dy=Math.sin(s.heading)*v.span;return [[x,y],[x+dx,y+dy],[x-dx,y-dy]];}
export function obstruction(s,x,y,vehicle=s.vehicle,includeTraffic=false){
 const v=vehicles[vehicle],proposed=samples(s,x,y,vehicle);
 if(includeTraffic&&s.z+(s.deck??0)<18){
  const escape=(x!==s.x||y!==s.y)?{from:[s.x,s.y],to:[x,y],previous:samples(s,s.x,s.y,vehicle)}:null;
  const car=trafficContact(s.traffic,proposed,v.r,s.time,escape);
  if(car)return car;
  const patrol=trafficContact(s.pursuit?.cars?.filter(p=>p.health>0),proposed,v.r,s.time,escape);
  if(patrol)return {...patrol,kind:'patrol'};
  for(const response of s.responses){
   if(!ambulanceVisible(response,s.time))continue;
   const shared={...response,vehicle:1,id:'response-'+response.depot.id};
   const emergency=trafficContact([shared],proposed,v.r,s.time,escape);
   if(emergency)return {...emergency,kind:'ambulance',car:response,resistance:1.2,hp:response.maxHealth};
  }
 }
 for(const [px,py] of proposed){
  if(boundaryBlocked(px,py,v.r))return {id:'boundary',kind:'boundary',resistance:1.2,hp:Infinity};
  if(s.z+(s.deck??0)<4&&pond(px,py))return {id:'water',kind:'water',resistance:.4,hp:Infinity};
  for(const o of nearby(px,py)){
   if(isDestroyed(s,o.id)||s.z+(s.deck??0)+groundHeight(s.x,s.y)>o.h+groundHeight(o.x,o.y)+2)continue;
   if(o.kind==='barrier'&&!crossingActive(crossingFor(o.crossing),s.time))continue;
   if(objectHits(o,px,py,v.r))return o;
  }
 }
 return null;
}
export function damageVehicle(s,amount,type='impact'){if(s.invulnerable>0)return;const i=s.vehicle;if(amount>0&&i===10)s.robotHurtAt=s.time;s.totalDamage=(s.totalDamage??0)+Math.min(s.health[i],Math.max(0,amount));s.health[i]=Math.max(0,s.health[i]-Math.max(0,amount));if(s.health[i]===0&&!s.broken){s.broken=true;s.breakdownAt=s.time;s.boost=0;emit(s,'breakdown',{cause:type});}}
export function collideWithTraffic(s,car){
 if(s.broken||car.health===0||(s.contactCooldown[car.id]??-99)>s.time)return;
 const otherSpeed=car.speed;
 const relative=Math.hypot(s.vx-Math.cos(car.heading)*otherSpeed,s.vy-Math.sin(car.heading)*otherSpeed);
 if(relative<15)return;
 s.contactCooldown[car.id]=s.time+.62;
 s.collisions++;
 const player=vehicles[s.vehicle],other=vehicles[car.vehicle];
 const force=relative**2*.0038;
 damageVehicle(s,force*other.mass/player.armor,'traffic');
 damageTraffic(car,force*player.mass/other.armor,s.time);
 emit(s,'traffic-hit',{x:car.x,y:car.y,force});
}
export function collideWithEmergency(s,car){
 if(s.broken||car.health<=0||(s.contactCooldown[car.id]??-99)>s.time)return;
 const relative=Math.hypot(s.vx-Math.cos(car.heading)*car.speed,s.vy-Math.sin(car.heading)*car.speed);if(relative<15)return;
 s.contactCooldown[car.id]=s.time+.65;s.collisions++;const v=vehicleStats(s),force=relative**2*.0038;
 damageVehicle(s,force*1.6/v.armor,'ambulance');damageTraffic(car,force*v.mass/1.25,s.time);emit(s,'traffic-hit',{x:car.x,y:car.y,force});
}
export function collideWithPatrol(s,car){
 if(s.broken||car.health<=0||(s.contactCooldown[car.id]??-99)>s.time)return;
 const relative=Math.hypot(s.vx-Math.cos(car.heading)*car.speed,s.vy-Math.sin(car.heading)*car.speed);
 if(relative<15)return;
 s.contactCooldown[car.id]=s.time+.8;s.collisions++;
 const v=vehicleStats(s),force=Math.min(32,Math.max(4,relative*.085));
 damageVehicle(s,force/v.armor,'patrol');damageTraffic(car,force*v.mass,s.time);
 emit(s,'traffic-hit',{x:car.x,y:car.y,force});
}
export function hitObject(s,o,speed){
 if(o.kind==='ambulance'){collideWithEmergency(s,o.car);return;}
 if(o.kind==='patrol'){collideWithPatrol(s,o.car);return;}
 if(o.kind==='traffic'){collideWithTraffic(s,o.car);return;}
 const v=vehicleStats(s);
 const front=(o.x-s.x)*Math.cos(s.heading)+(o.y-s.y)*Math.sin(s.heading);
 const push=Boolean(v.blade&&Number.isFinite(o.hp)&&front>8&&speed>2);
 if((speed<20&&!push)||(s.contactCooldown[o.id]??-99)>s.time)return;
 s.contactCooldown[o.id]=s.time+(push?.21:.28);s.collisions++;
 const energy=v.mass*speed*speed*.008+(push?v.blade:0);
 const resistance=o.resistance??1;s.lastHit={id:o.id,time:s.time};
 if(Number.isFinite(o.hp)){const before=s.damage[o.id]??0;s.damage[o.id]=Math.min(o.hp,before+energy/resistance/cityArmor(s,o));if(s.damage[o.id]>=o.hp&&before<o.hp){s.destroyedCount++;recordDemolition(s,o);emit(s,'object-break',{id:o.id,material:o.material,h:o.h,w:o.w,d:o.d,x:o.x,y:o.y});}else emit(s,'object-hit',{id:o.id,x:o.x,y:o.y});}
 damageVehicle(s,Math.max(2,v.mass*speed*speed*.0008*resistance/v.armor));
}
function countPedestrianImpacts(s,oldX,oldY){
 if(s.z+(s.deck??0)>=14||Math.hypot(s.x-oldX,s.y-oldY)<.012)return;
 const start=samples(s,oldX,oldY),end=samples(s,s.x,s.y),r=vehicles[s.vehicle].r+4;
 for(const person of s.crowd?.people??[]){
  if((s.struck.get(person.id)?.recoverAt??0)>s.time)continue;
  if(!start.some((a,i)=>segmentDistance(person.x,person.y,{a,b:end[i]})<r))continue;
  harmCitizen(s,person,true);
  emit(s,'pedestrian-hit',{x:person.x,y:person.y,id:person.id});
 }
}
export function step(s,input,dt){
 input={throttle:0,steer:0,brake:false,...input};
 dt=Math.max(0,Math.min(dt,1/60));s.time+=dt;s.driveTime+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);s.boost=Math.max(0,s.boost-dt);
 updateRailSurface(s);
 const base=vehicleStats(s),weather=weatherHandling(s),v={...base,max:base.max*weather.max,accel:base.accel*weather.accel,brake:base.brake*weather.brake,grip:base.grip*weather.grip,steer:base.steer*weather.steer},oldX=s.x,oldY=s.y;
 if(s.broken){s.vx=0;s.vy=0;s.speed=0;return {hit:false,moved:0,road:isRoad(s.x,s.y,12)};}
 if(s.z>0||s.vz>0){s.vz-=240*dt;s.z+=s.vz*dt;s.maxZ=Math.max(s.maxZ,s.z);if(s.z<=0){s.z=0;s.vz=0;s.airSpeedLimit=undefined;emit(s,'land');if(pond(s.x,s.y)){damageVehicle(s,20);rescue(s);emit(s,'water-rescue');return {hit:true,moved:0,road:false};}}}
 const cos=Math.cos(s.heading),sin=Math.sin(s.heading),forward=s.vx*cos+s.vy*sin,side=-s.vx*sin+s.vy*cos;
 let f=forward;const road=s.surface==='rail'||isRoad(s.x,s.y,12),terrain=road||s.z>0?1:.67,limit=v.max*(s.boost>0?1.72:1)*terrain;
 if(input.throttle>0)f+=v.accel*input.throttle*(s.boost>0?3.7:1)*dt;
 if(input.throttle<0)f-=(forward>8?v.brake:v.accel*.62)*-input.throttle*dt;
 if(input.brake&&s.z===0)f*=Math.exp(-6.2*dt);
 f*=Math.exp(-(input.throttle ? .19 : .94)*dt);f=Math.max(-v.max*.17*terrain,Math.min(limit,s.airSpeedLimit??Infinity,f));
 if(s.z===0&&Math.abs(f)>1){
  const rail=s.surface==='rail'?railSurface(s.x,s.y):null;
  const slope=roadGrade(s.x,s.y,s.heading)+(rail?rail.grade*Math.cos(s.heading-rail.angle):0);
  if(slope!==0){const adjusted=f-slope*(rail||v.blade?65:152)*dt;f=f*adjusted>0?adjusted:0;}
  f=Math.max(-v.max*.17*terrain,Math.min(limit,s.airSpeedLimit??Infinity,f));
 }
 const oldHeading=s.heading,turn=v.steer*(.20+Math.min(Math.abs(f)/70,.85))*(f<0?-1:1)*(s.z>0?.48:1)/(1+Math.max(0,Math.abs(f)-v.max*.5)*.004);
 if(Math.abs(f)>1)s.heading+=input.steer*turn*dt;
 if(s.z===0&&obstruction(s,s.x,s.y))s.heading=oldHeading;
 const lateral=side*Math.exp(-(s.z>0?1.2:input.brake?2.5:v.grip)*dt);
 s.vx=Math.cos(s.heading)*f-Math.sin(s.heading)*lateral;s.vy=Math.sin(s.heading)*f+Math.cos(s.heading)*lateral;
 let hit=false;const nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;
 let o=Math.abs(nx-s.x)>1e-8?obstruction(s,nx,s.y,s.vehicle,true):null;if(o){hitObject(s,o,Math.abs(s.vx));if(o.kind==='water')s.vx*=.1;else s.vx*=-.16;hit=true;if(!obstruction(s,nx,s.y,s.vehicle,true))s.x=nx;}else s.x=nx;
 o=Math.abs(ny-s.y)>1e-8?obstruction(s,s.x,ny,s.vehicle,true):null;if(o){hitObject(s,o,Math.abs(s.vy));if(o.kind==='water')s.vy*=.1;else s.vy*=-.16;hit=true;if(!obstruction(s,s.x,ny,s.vehicle,true))s.y=ny;}else s.y=ny;
 updateRailSurface(s);
 for(const train of trainsAt(s.time)){
  if(!trainInView(train)||s.z+(s.deck??0)+groundHeight(s.x,s.y)>train.z+groundHeight(train.x,train.y)+train.h+2||s.z+(s.deck??0)+groundHeight(s.x,s.y)+15<train.z+groundHeight(train.x,train.y))continue;
  if(!samples(s,s.x,s.y).some(([x,y])=>objectHits(train,x,y,v.r)))continue;
  if((s.contactCooldown[train.id]??-99)>s.time)continue;
  s.contactCooldown[train.id]=s.time+1;s.trainHits++;s.collisions++;
  const relative=Math.max(50,Math.hypot(s.vx-train.vx,s.vy-train.vy));
  damageVehicle(s,relative*.80/v.armor,'train');emit(s,'train-hit',{id:train.id});
  const c=Math.cos(train.angle),n=Math.sin(train.angle),x=s.x+c*18,y=s.y+n*18;
  if(!obstruction(s,x,y)){s.x=x;s.y=y;}
  s.vx=c*32;s.vy=n*32;hit=true;
 }
 s.speed=s.vx*Math.cos(s.heading)+s.vy*Math.sin(s.heading);const moved=Math.hypot(s.x-oldX,s.y-oldY);s.distance+=moved;if(s.vehicle===10)s.robotGaitPhase=(s.robotGaitPhase??0)+moved*Math.sign(s.speed)/(Math.abs(s.speed)>170?16:10);
 countPedestrianImpacts(s,oldX,oldY);
 if(s.broken){s.vx=0;s.vy=0;s.speed=0;return {hit,moved,road};}
 if(s.z===0&&s.speed>=30){
  for(const pad of surfaces){
   if((s.surfaceCooldown[pad.id]??-99)>s.time)continue;
   const dx=s.x-pad.x,dy=s.y-pad.y;
   if(Math.abs(dx)>pad.d||Math.abs(dy)>pad.d)continue;
   const c=Math.cos(pad.angle),n=Math.sin(pad.angle);
   if(Math.abs(dx*c+dy*n)>pad.d/2||Math.abs(-dx*n+dy*c)>pad.w/2||Math.cos(s.heading-pad.angle)<.65)continue;
   s.surfaceCooldown[pad.id]=s.time+2.5;
   if(pad.type==='boost'){
    s.boost=2.2;
    s.boosts++;
    emit(s,'boost',{id:pad.id});
   }else{
    // Short ramps keep the landing on the current stretch of road even after a boost.
    s.airSpeedLimit=pad.shortJump?215:undefined;
    if(pad.shortJump&&s.speed>s.airSpeedLimit){
     const scale=s.airSpeedLimit/s.speed;
     s.vx*=scale;s.vy*=scale;s.speed=s.airSpeedLimit;
    }
    const push=(130+Math.min(s.speed,190)*.22)*v.jump;
    s.vz=pad.shortJump?push*.80:push;
    s.jumps++;
    emit(s,'jump',{id:pad.id});
   }
   break;
  }
 }
 if(road&&s.z===0&&!(s.deck>0)&&!obstruction(s,s.x,s.y)&&!crossingsClose(s.x,s.y))s.safe={x:s.x,y:s.y,heading:s.heading};
 const repairPoint=!s.pursuit&&!(s.deck>0)&&s.z===0&&Math.abs(s.speed)<4&&repairPoints.find(p=>Math.hypot(s.x-p.x,s.y-p.y)<(p.service?SERVICE_RADIUS:65));
 if(repairPoint){
  if(s.repairSite!==repairPoint.id)s.repairTime=0;
  s.repairSite=repairPoint.id;
  s.repairTime+=dt;
  if(s.repairTime>.55&&s.health[s.vehicle]<v.hp)s.health[s.vehicle]=Math.min(v.hp,s.health[s.vehicle]+v.hp*.6*dt);
 }else{s.repairTime=0;s.repairSite=null;}
 return {hit,moved,road};
}
function crossingsClose(x,y){return crossings.some(c=>Math.abs(x-c.x)<c.w/2+40&&Math.abs(y-c.y)<120);}
export function rescue(s,requestedId){
 const broken=s.broken||s.health[s.vehicle]<=0;
 const choices=broken?recoverySites(s):[s.safe,...recoverySites(s)];
 if(broken&&requestedId){
  const requested=choices.find(p=>p.id===requestedId);
  if(requested)choices.unshift(requested);
 }
 s.z=0;s.vz=0;s.deck=0;s.surface='ground';s.airSpeedLimit=undefined;
 const free=p=>{
  s.heading=p.heading;
  return !crossingsClose(p.x,p.y)&&!obstruction(s,p.x,p.y,s.vehicle,true);
 };
 const p=choices.find(free)??SPAWN;
 s.x=p.x;s.y=p.y;s.heading=p.heading;s.vx=0;s.vy=0;s.speed=0;s.boost=0;s.invulnerable=2;
 s.safe={x:p.x,y:p.y,heading:p.heading};s.broken=false;s.breakdownAt=undefined;s.repairTime=0;s.repairSite=null;
 if(broken){s.health[s.vehicle]=vehicleStats(s).hp;emit(s,'repair');}
 return p;
}
export function repair(s){s.health[s.vehicle]=vehicleStats(s).hp;s.broken=false;s.breakdownAt=undefined;s.invulnerable=2;}
export function rebuildTown(s){s.damage=Object.create(null);s.destroyedCount=0;emit(s,'rebuild');if(obstruction(s,s.x,s.y))rescue(s);}
export function switchVehicle(s,index){if(s.pursuit||s.hero?.owned[index]===false||!Number.isInteger(index)||index<0||index>=vehicles.length||s.z>0||obstruction(s,s.x,s.y,index))return false;s.vehicle=index;s.vx=0;s.vy=0;s.speed=0;s.boost=0;s.broken=s.health[index]<=0;s.breakdownAt=undefined;return true;}
export function decodeSave(raw){try{
 const d=JSON.parse(raw);if(!d||![1,2,3,4,5,6,7,8,9,10,11,12,13].includes(d.version)||!['x','y','heading','distance'].every(k=>Number.isFinite(d[k]))||!Number.isInteger(d.vehicle)||d.vehicle<0||d.vehicle>=savedSlots(d.version)||d.distance<0||d.distance>1e9||!Array.isArray(d.collected)||d.collected.length>spots.length||d.collected.some(id=>!spots.some(p=>p.id===id)))return null;
 if(d.worldRevision!==undefined&&![2,3,4,5,6].includes(d.worldRevision))return null;
 if(d.worldRevision!==6)d.migrated=true;
 if(d.migrated&&d.damage&&typeof d.damage==='object'&&!Array.isArray(d.damage))for(const id of Object.keys(d.damage))if(world.cleared.has(id)||id.startsWith('city-lot-'))delete d.damage[id];
 if(d.version===9||d.version===10)d.migrated=true;
 if(d.version<9){d.jobHistory=[];d.migrated=true;}
 if(!validJobHistory(d.jobHistory))return null;
 if(d.version<8)d.upgrades=newUpgrades();
 if(d.version===7)d.migrated=true;
 if(d.version<12&&Array.isArray(d.upgrades)&&d.upgrades.length===7)d.upgrades=[...d.upgrades,...vehicles.slice(7).map(()=>[0,0,0,0])];
 if(d.version===12){if(!Array.isArray(d.upgrades)||d.upgrades.length!==10||!d.hero||!Array.isArray(d.hero.owned)||d.hero.owned.length!==10||!Array.isArray(d.hero.equipment)||d.hero.equipment.length!==10)return null;d.upgrades.push([0,0,0,0]);d.hero.vehicleTalks=d.hero.owned.flatMap((v,i)=>v?[i]:[]);d.hero.owned.push(false);d.hero.equipment.push(null);d.migrated=true;}
 if(!validUpgrades(d.upgrades))return null;
 if(d.version<12){d.hero=newHero();d.hero.owned=vehicles.map((_,i)=>i<7);d.hero.lastHits=d.pedestrianHits??0;d.hero.casualties=Math.min(10000000,d.pedestrianHits??0);d.migrated=true;}else if(!validHero(d.hero))return null;
 if(d.version===1){if(d.x<100||d.x>1790||d.y<115||d.y>1670)return null;d.x+=1275;d.y+=560;d.health=vehicles.map(v=>v.hp);d.damage={};d.time=0;d.migrated=true;}
 else {if(d.x<WEST_EDGE+110||d.x>SIZE.w-110||d.y<130||d.y>SIZE.h-130||!Number.isFinite(d.time)||d.time<0||d.time>1e9||!Array.isArray(d.health)||(d.health.length!==savedSlots(d.version)&&!(d.version>=7&&d.health.length===vehicles.length))||d.health.some((x,i)=>!Number.isFinite(x)||x<0||x>savedMaximum(d.version,i,d))||!d.damage||typeof d.damage!=='object'||Array.isArray(d.damage)||Object.keys(d.damage).length>world.solids.length)return null;}
 if(d.version===2){
 for(const [id,value] of Object.entries(d.damage)){
   if(world.byId.has(id))continue;
   const match=/^(building|tree|prop)-(\d+)$/.exec(id);
   const legacyLimits={building:349,tree:423,prop:512};
   if(!match||Number(match[2])>=legacyLimits[match[1]]||!Number.isFinite(value)||value<0||value>1800)return null;
   delete d.damage[id];
  }
  d.migrated=true;
 }
 if(d.version===3){
  for(const [id,value] of Object.entries(d.damage)){
   if(world.byId.has(id))continue;
   if(!/^(west|east)-\d+-\d+-(house|tree|prop)$|^east-orchard-\d+-\d+$/.test(id)||!Number.isFinite(value)||value<0||value>780)return null;
   delete d.damage[id];
  }
  d.migrated=true;
 }
 if(d.version<7){
  if(d.version>1)d.health=vehicles.map((v,i)=>i<d.health.length?d.health[i]*(v.hp/savedMaximum(d.version,i)):v.hp);
  if(d.version<6)d.pedestrianHits=0;
  d.migrated=true;
 }
 if(!Number.isSafeInteger(d.pedestrianHits)||d.pedestrianHits<0)return null;
 for(const [id,value] of Object.entries(d.damage)){
  if(!world.byId.has(id)||!Number.isFinite(value)||value<0||value>world.byId.get(id).hp)return null;
 }
 if(d.points===undefined)d.points=0;
 if(!Number.isSafeInteger(d.points)||d.points<0)return null;
 if(d.health.length<vehicles.length)d.health=vehicles.map((v,i)=>d.health[i]??vehicleStats(d,i).hp);
 const s=createState(d);
 if(d.migrated)for(const id of world.cleared)delete d.damage[id];
 if(obstruction(s,d.x,d.y)){
  if(!d.migrated)return null;
  const position=(d.version>=4||d.x<0||d.x>3300)?nearbyDistrictRoad(s,d.version>=4):null;
  Object.assign(d,position??SPAWN);
 }
 return d;
 }catch{return null;}}
function nearbyDistrictRoad(s,allRoads=false){
 let best=null,distance=Infinity;
 const theme=s.x<0?'west':'east';
 for(const road of roads){
  if(!allRoads&&road.theme!==theme)continue;
  const dx=road.b[0]-road.a[0],dy=road.b[1]-road.a[1];
  const t=Math.max(.05,Math.min(.95,((s.x-road.a[0])*dx+(s.y-road.a[1])*dy)/(dx*dx+dy*dy)));
  const x=road.a[0]+t*dx,y=road.a[1]+t*dy,d=Math.hypot(x-s.x,y-s.y);
  if(d>=distance)continue;
  s.heading=Math.atan2(dy,dx);
  if(!obstruction(s,x,y)){best={x,y,heading:s.heading};distance=d;}
 }
 return best;
}
export function encodeSave(s){const p=s.z>0||s.deck>0||obstruction(s,s.x,s.y)?s.safe:s;return JSON.stringify({version:13,worldRevision:6,hero:s.hero,x:p.x,y:p.y,heading:p.heading,vehicle:s.vehicle,distance:s.distance,collected:[...s.collected],health:s.health,damage:s.damage,time:s.time,pedestrianHits:s.pedestrianHits,points:s.points,upgrades:s.upgrades,jobHistory:s.jobHistory});}
