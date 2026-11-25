import {repairCost} from './balance-tuning.js?v=5.3.0';
import {recordAbsence,returnCitizens,validEvacuations} from './citizen-recovery.js?v=5.3.0';
import {validMonsterAttack} from './monster-attacks.js?v=5.3.0';
import {newCity,validCity,offerCityWeek,cityObjectActive,cityArmor} from './city-evolution.js?v=5.3.0';
import {newCareer,validCareer,newTutorial,validTutorial} from './career-progress.js?v=5.3.0';
import {monsterDaySeconds,heroClock,monsterPower,restoreMonster,checkMonsterDeadline} from './monster-behavior.js?v=5.3.0';
import {queueVehicleTalk} from './vehicle-talk.js?v=5.3.0';
import {newRobotProgress,validRobotProgress,updateRobotProgress,buyRobotPart,recordDemolition} from './robot-progress.js?v=5.3.0';
import {machinePrices,machinePrice,weaponUpgradeCost} from './economy.js?v=5.3.0';
export {machinePrices} from './economy.js?v=5.3.0';
import {newWeather,validWeather,updateWeather} from './weather.js?v=5.3.0';
import {world,roads,WEST_EDGE,SIZE,isDestroyed,objectHits} from './world.js?v=5.3.0';
import {vehicles} from './vehicle-specs.js?v=5.3.0';
import {vehicleStats,garageAt} from './upgrades.js?v=5.3.0';

export const daySeconds=monsterDaySeconds,raidInterval=3;
export const weaponSpecs=[
 {id:'machinegun',name:'ツインマシンガン',cost:4000,damage:180,range:540,cooldown:.09,color:'#ffe4a0',description:'遠くから狙える連射。弾道上の建物にも当たる。'},
 {id:'flame',name:'火炎放射機',cost:12000,damage:310,range:210,cooldown:.07,color:'#ff9460',description:'近距離を焼く。周りの建物も傷つきやすい。'},
 {id:'saw',name:'超大型電動のこぎり',cost:26000,damage:620,range:112,cooldown:.07,color:'#b8f0e2',description:'接近戦の切り札。建物への破壊力も最大。'}
];

export function newHero(){return {city:newCity(),career:newCareer(),tutorial:newTutorial(),vehicleTalks:[0,1],robot:newRobotProgress(),day:1,clock:0,nextRaid:6,raids:0,raidVisits:0,growth:0,casualties:0,evacuations:[],lastHits:0,owned:vehicles.map((_,i)=>i<2),weapons:[],equipment:vehicles.map(()=>null),weaponLevels:[0,0,0],rebuild:{},rebuildProgress:{},fires:[],monster:null,result:null,totalEarned:0,lastRank:null,jobCount:0,weather:newWeather(),introSeen:false,lastTaxWeek:0,lastTax:null};}
export function restoreHero(saved){const h={...newHero(),...structuredClone(saved??{})};if(saved&&saved.lastTaxWeek===undefined)h.lastTaxWeek=Math.floor((h.day-1)/7);h.raidVisits=saved?.raidVisits??(h.raids+(h.monster?1:0));h.city={...newCity(),...(saved?.city??{})};h.career={...newCareer(),...(saved?.career??{})};h.tutorial=saved?.tutorial??{...newTutorial(),stage:saved?.introSeen?6:0};if(saved&&saved.evacuations===undefined&&h.casualties>0)h.evacuations=[{count:h.casualties,returnAt:heroClock(h)+120}];restoreMonster(h);return h;}
export function validHero(h){
 const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max,ints=(n,min,max)=>Number.isInteger(n)&&finite(n,min,max);
 if(h&&(!validCity(h.city)||!validCareer(h.career)||!validTutorial(h.tutorial)||!validEvacuations(h)))return false;
 if(!h||!ints(h.day,1,100000)||!finite(h.clock,0,daySeconds)||!ints(h.nextRaid,1,100003)||!ints(h.raids,0,100000)||!ints(h.growth,-1000000,1000000)||!ints(h.casualties,0,10000000)||!ints(h.lastHits,0,Number.MAX_SAFE_INTEGER)||!finite(h.totalEarned,0,Number.MAX_SAFE_INTEGER)||!ints(h.jobCount,0,10000000))return false;
 if(!Array.isArray(h.owned)||h.owned.length!==vehicles.length||h.owned.some(v=>typeof v!=='boolean')||!h.owned[0]||!Array.isArray(h.weapons)||h.weapons.length>3||new Set(h.weapons).size!==h.weapons.length||h.weapons.some(w=>!weaponSpecs.some(v=>v.id===w)))return false;
 if(!Array.isArray(h.equipment)||h.equipment.length!==vehicles.length||h.equipment.some(w=>w!==null&&!h.weapons.includes(w))||!Array.isArray(h.weaponLevels)||h.weaponLevels.length!==3||h.weaponLevels.some(n=>!ints(n,0,3)))return false;
 if(!h.rebuild||Array.isArray(h.rebuild)||Object.keys(h.rebuild).length>world.solids.length||Object.entries(h.rebuild).some(([id,t])=>!world.byId.has(id)||!finite(t,0,1e9)))return false;
 if(!h.rebuildProgress||Array.isArray(h.rebuildProgress)||Object.entries(h.rebuildProgress).some(([id,p])=>!world.byId.has(id)||!finite(p,0,1)))return false;
 if(!Array.isArray(h.fires)||h.fires.length>20||h.fires.some(f=>!f||!world.byId.has(f.id)||!finite(f.power,0,1)))return false;
 if(h.vehicleTalks!==undefined&&(!Array.isArray(h.vehicleTalks)||new Set(h.vehicleTalks).size!==h.vehicleTalks.length||h.vehicleTalks.some(i=>!ints(i,0,10))))return false;
 if(h.robot!==undefined&&!validRobotProgress(h.robot))return false;
 if(h.raidVisits!==undefined&&!ints(h.raidVisits,0,100000))return false;
 const m=h.monster;if(m&&(!finite(m.x,WEST_EDGE-500,SIZE.w+500)||!finite(m.y,-500,SIZE.h+500)||!finite(m.hp,0,100000)||!finite(m.maxHp,1,100000)||!finite(m.heading,-Math.PI*4,Math.PI*4)||!finite(m.windup,0,3)||!finite(m.cooldown,0,6)||!ints(m.kind,0,1)))return false;
 if(m&&(m.hp>m.maxHp||m.strike&&(!finite(m.strike.x,WEST_EDGE-500,SIZE.w+500)||!finite(m.strike.y,-500,SIZE.h+500))||m.target!==null&&m.target!==undefined&&!world.byId.has(m.target)))return false;
 if(m&&(m.phase!==undefined&&!['approaching','active','retreating'].includes(m.phase)||m.level!==undefined&&!ints(m.level,0,100000)||m.enteredAt!==undefined&&!finite(m.enteredAt,0,heroClock(h))||m.chooseAt!==undefined&&!finite(m.chooseAt,0,heroClock(h)+16)||m.targetPerson!=null&&(typeof m.targetPerson!=='string'||m.targetPerson.length>160)||m.exit&&(!finite(m.exit.x,WEST_EDGE-500,SIZE.w+500)||!finite(m.exit.y,0,SIZE.h))))return false;
 if(m&&(m.attack!=null&&!validMonsterAttack(m.attack)||m.lastAttack!=null&&!['stomp','slash','beam','meteor'].includes(m.lastAttack)||m.projectiles!==undefined&&(!Array.isArray(m.projectiles)||m.projectiles.length>9||m.projectiles.some(p=>!validMonsterAttack(p)||p.kind!=='meteor'||!finite(p.remaining,0,2.5)||!finite(p.duration,1,2.5)))))return false;
 if(h.lastRank&&(!['S','A','B','C'].includes(h.lastRank.rank)||!finite(h.lastRank.seconds,0,1e9)||!finite(h.lastRank.damage,0,1e9)||!finite(h.lastRank.reward,0,Number.MAX_SAFE_INTEGER)))return false;
 if(h.introSeen!==undefined&&typeof h.introSeen!=='boolean'||h.lastTaxWeek!==undefined&&!ints(h.lastTaxWeek,0,Math.floor((h.day-1)/7)))return false;
 if(h.weather!==undefined&&!validWeather(h.weather))return false;
 if(h.lastTax&&(!ints(h.lastTax.week,1,14285)||!ints(h.lastTax.day,1,h.day)||!ints(h.lastTax.population,0,Number.MAX_SAFE_INTEGER)||!ints(h.lastTax.amount,0,Number.MAX_SAFE_INTEGER)))return false;
 return true;
}
export function collectWeeklyTax(s){
 const h=s.hero,week=Math.floor((h.day-1)/7);if(week<=h.lastTaxWeek)return null;
 const residents=population(s),amount=Math.min(residents,Number.MAX_SAFE_INTEGER-s.points);h.lastTaxWeek=week;s.points+=amount;h.totalEarned=Math.min(Number.MAX_SAFE_INTEGER,h.totalEarned+amount);h.lastTax={week,day:h.day,population:residents,amount};
 offerCityWeek(h);
 heroNotice(s,'週の税収 ＋'+amount.toLocaleString('ja-JP')+' pt。人口 '+residents.toLocaleString('ja-JP')+'人 × 1 pt。');return h.lastTax;
}
export const buildingResidents=b=>b.kind==='building'&&!b.vacant?Math.max(2,Math.round(b.w*b.d*Math.max(1,b.h/45)/1500)):0;
export const basePopulation=world.buildings.filter(b=>!b.evolutionReserve).reduce((n,b)=>n+buildingResidents(b),0)+1200;
export function population(s){let absent=0,extra=0;for(const b of world.buildings){const active=cityObjectActive(s,b);if(b.evolutionReserve&&active)extra+=buildingResidents(b);else if(!b.evolutionReserve&&!active)extra-=buildingResidents(b);}for(const [id,damage] of Object.entries(s.damage)){const b=world.byId.get(id);if(b?.kind==='building'&&cityObjectActive(s,b))absent+=buildingResidents(b)*Math.min(1,damage/b.hp)*(1-(s.hero.rebuildProgress?.[id]??0));}return Math.max(0,Math.round(basePopulation+s.hero.growth+(s.hero.city?.population??0)+extra-s.hero.casualties-absent));}
export function heroNotice(s,text){s.heroNotice=text;}
export function hurtBuilding(s,b,amount){
 if(!b||b.kind!=='building'||amount<=0||!cityObjectActive(s,b))return;amount/=cityArmor(s,b);
 const before=s.damage[b.id]??0;s.damage[b.id]=Math.min(b.hp,before+amount);
 if(before<b.hp&&s.damage[b.id]>=b.hp){s.events.push({type:'object-break',id:b.id,x:b.x,y:b.y,w:b.w,d:b.d,h:b.h,material:b.material,time:s.time});s.hero.rebuild[b.id]=s.time+25;recordDemolition(s,b);}
}
export function updateRebuild(s,dt){
 for(const [id,value] of Object.entries(s.damage)){
  const b=world.byId.get(id);if(!b||b.kind!=='building'||!value)continue;
  if(s.hero.rebuild[id]===undefined)s.hero.rebuild[id]=s.time+25;
  if(s.work?.stops?.[s.work.index]?.building===id||s.time<s.hero.rebuild[id]||s.hero.fires.some(f=>f.id===id))continue;
  // Keep rubble non-solid until all rebuilding is complete. The frame grows visually.
  const progress=s.hero.rebuildProgress;
  if(value>=b.hp){progress[id]=Math.min(1,(progress[id]??0)+dt*(s.hero.city?.rebuild??1)/150);if(progress[id]<1)continue;
   if(objectHits(b,s.x,s.y,vehicles[s.vehicle].r)||s.traffic?.some(c=>c.health>0&&objectHits(b,c.x,c.y,16)))continue;
   delete progress[id];delete s.damage[id];delete s.hero.rebuild[id];
  }else{s.damage[id]=Math.max(0,value-b.hp*dt*(s.hero.city?.rebuild??1)/150);if(!s.damage[id]){delete s.damage[id];delete s.hero.rebuild[id];}}
 }
}
export function rebuildFraction(s,id){return s.hero.rebuildProgress?.[id]??0;}
export function startRaid(s){
 if(s.hero.monster)return false;
 const level=Math.max(s.hero.raids,s.hero.raidVisits??0),kind=level%2,side=kind===0?WEST_EDGE-250:SIZE.w+250,x=side,y=kind===0?1000:4900;
 const {maxHp}=monsterPower(level);s.hero.raidVisits=Math.min(100000,level+1);
 s.hero.monster={kind,x,y,hp:maxHp,maxHp,level,enteredAt:heroClock(s.hero),phase:'approaching',heading:kind===0?0:Math.PI,windup:0,cooldown:2,target:null,projectiles:[]};s.hero.result=null;
 s.hero.guideMonster=true;
 heroNotice(s,(kind===0?'山側から岩角獣ガンロウ':'海側から潮甲獣アオナギ')+'が接近！ 武装して街を守ろう。');return true;
}
export function updateLife(s,dt){
 const h=s.hero;if(!h)return;
 updateRobotProgress(s,population(s));
 countWreckVictims(s);
 const hits=Math.max(0,s.pedestrianHits-h.lastHits);recordAbsence(s,hits);h.lastHits=s.pedestrianHits;
 h.tutorial.elapsed+=dt;h.clock+=dt;
 while(h.clock>=daySeconds){h.clock-=daySeconds;h.day++;const change=h.day%4===0?-9:population(s)>basePopulation*.75?18:5;h.growth+=change;heroNotice(s,h.day+'日目。人口 '+(change>=0?'＋':'')+change+'人。');collectWeeklyTax(s);}
 if(h.day>=h.nextRaid&&!h.monster&&(h.raidVisits>0||h.tutorial.stage>=5||h.day>=8)){startRaid(s);}
 returnCitizens(h);checkMonsterDeadline(s);updateWeather(s);updateRebuild(s,dt);
 for(const f of h.fires){const b=world.byId.get(f.id);if(b)hurtBuilding(s,b,b.hp*.004*f.power*dt);}
 h.fires=h.fires.filter(f=>f.power>0);
}
export function shopAt(s){return garageAt(s);}
export function shopPurchase(s,type,id){
 if(!shopAt(s))return {ok:false,message:'ガレージの中に入庫して停車してください。'};
 if(type==='robot-part')return buyRobotPart(s,id,population(s));
 const h=s.hero;let cost=0,action;
 if(type!=='vehicle'&&h.owned[s.vehicle]!==true)return {ok:false,message:'先にこの乗り物を購入してください。'};
 if(type==='vehicle'){const index=Number(id);cost=machinePrices[index]?machinePrice(s,index):0;if(!cost||h.owned[index])return {ok:false,message:'購入済みです。'};action=()=>{h.owned[index]=true;queueVehicleTalk(s,index);};}
 else if(type==='weapon'){const w=weaponSpecs.find(w=>w.id===id);if(!w)return {ok:false,message:'武器を選んでください。'};if(h.weapons.includes(id)){h.equipment[s.vehicle]=h.equipment[s.vehicle]===id?null:id;return {ok:true,message:h.equipment[s.vehicle]?'武器を装備しました。':'武器を外しました。'};}cost=w.cost;action=()=>{h.weapons.push(id);h.equipment[s.vehicle]=id;};}
 else if(type==='weapon-upgrade'){const index=weaponSpecs.findIndex(w=>w.id===id),level=h.weaponLevels[index];if(index<0||!h.weapons.includes(id)||level>=3)return {ok:false,message:'購入済みの武器をLv.3まで強化できます。'};cost=weaponUpgradeCost(level);action=()=>{h.weaponLevels[index]++;(h.robot??=newRobotProgress()).weaponUpgrades++;};}
 else if(type==='repair'){const missing=vehicleStats(s).hp-s.health[s.vehicle];if(missing<.01)return {ok:false,message:'車体は完全な状態です。'};cost=repairCost(missing);action=()=>{s.health[s.vehicle]=vehicleStats(s).hp;s.broken=false;s.breakdownAt=undefined;};}
 else return {ok:false,message:'商品を選んでください。'};
 if(!Number.isSafeInteger(s.points)||s.points<cost)return {ok:false,message:'あと '+Math.max(0,cost-s.points)+' pt必要です。'};
 s.points-=cost;action();return {ok:true,message:cost+' ptで購入・整備しました。'};
}
export function rankJob(job,s){
 const seconds=job.elapsed??0,damage=Math.max(0,(s.totalDamage??0)-(job.damageStart??0)),budget=Math.max(25,(job.plannedMetres??200)/6+job.stops.length*2+20),ratio=seconds/budget,hp=vehicleStats(s,job.vehicle).hp;
 const rank=ratio<=1&&damage<=.01?'S':ratio<=1.5&&damage<=hp*.12?'A':ratio<=2.2&&damage<=hp*.35?'B':'C';
 return {rank,seconds:Math.round(seconds*10)/10,damage:Math.round(damage*10)/10,multiplier:{S:1.25,A:1.12,B:1,C:.85}[rank]};
}

export function countWreckVictims(s){
 let count=0;for(const car of [...(s.traffic??[]),...(s.responses??[]),...(s.pursuit?.cars??[])]){
  if(car.health!==0||car.citizensLost)continue;
  let hash=0;for(const c of String(car.id??'car'))hash=(hash*31+c.charCodeAt(0))>>>0;
  car.citizensLost=true;const people=Math.max(1,Math.min(4,car.occupants??(1+hash%4)));count+=people;
 }recordAbsence(s,count);return count;
}
