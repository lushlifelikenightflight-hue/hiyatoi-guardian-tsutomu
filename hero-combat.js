import {cityArmor,harmCitizen,cityObjectActive} from './city-evolution.js?v=5.6.0';
import {checkMonsterDeadline,updateRetreat,updateApproach,monsterGoal,monsterPower,walkMonster} from './monster-behavior.js?v=5.6.0';
import {monsterAttacks,chooseMonsterAttack,aimMonsterAttack,armMonsterAttack,scatterMeteorTargets,monsterAttackHits,beamHeightAt} from './monster-attacks.js?v=5.6.0';
import {updateRobotAttack} from './robot-motion.js?v=5.6.0';
import {robotWeapons} from './robot-specs.js?v=5.6.0';
import {weaponTrace} from './weapon-trace.js?v=5.6.0';
import {dispatchAmbulance} from './ambulance.js?v=5.6.0';
import {world,isDestroyed,objectHits} from './world.js?v=5.6.0';
import {vehicleStats} from './upgrades.js?v=5.6.0';
import {weaponSpecs,hurtBuilding,heroNotice,population} from './hero-life.js?v=5.6.0';
import {damageTraffic} from './traffic.js?v=5.6.0';
import {segmentDistance} from './geometry.js?v=5.6.0';

export function combatEffect(s,kind,x,y,size=45){s.combatEffects??=[];s.combatEffects.push({kind,x,y,size,at:s.time});if(s.combatEffects.length>40)s.combatEffects.shift();}
export function monsterContact(s,m,old){
 if(m.phase==='retreating'||s.broken||(s.deck??0)+s.z>55||(m.contactAt??-99)+.65>s.time)return;
 const radius=66+vehicleStats(s).r;
 if(segmentDistance(s.x,s.y,{a:[old.x,old.y],b:[m.x,m.y]})>radius)return;
 const speed=Math.hypot(s.vx,s.vy),force=Math.min(260,Math.max(8,speed*speed*.0028*vehicleStats(s).mass));
 combatDamage(s,Math.max(10,force*.22));m.hp=Math.max(0,m.hp-force);m.hitAt=s.time;m.contactAt=s.time;s.collisions++;
 const angle=Math.atan2(s.y-m.y,s.x-m.x);s.vx=Math.cos(angle)*Math.max(30,speed*.3);s.vy=Math.sin(angle)*Math.max(30,speed*.3);
 combatEffect(s,'contact',(m.x+s.x)/2,(m.y+s.y)/2,55);
}

export const cannonSpec={id:'cannon',name:'標準榴弾砲',damage:520,range:680,cooldown:.95,color:'#ffd994'};
export function activeWeapon(s){if(s.vehicle===10)return robotWeapons[s.hero.robot?.weapon??'rifle'];const id=s.hero.equipment[s.vehicle],index=weaponSpecs.findIndex(w=>w.id===id);return index<0?(s.vehicle===9?cannonSpec:null):{...weaponSpecs[index],damage:weaponSpecs[index].damage*(1+s.hero.weaponLevels[index]*.3)};}
export function combatDamage(s,amount){if(s.invulnerable>0||s.broken)return;const loss=Math.min(s.health[s.vehicle],amount/vehicleStats(s).armor);s.health[s.vehicle]-=loss;if(loss>0&&s.vehicle===10)s.robotHurtAt=s.time;s.totalDamage=(s.totalDamage??0)+loss;if(s.health[s.vehicle]<=0){s.broken=true;s.breakdownAt=s.time;s.events.push({type:'breakdown',time:s.time,x:s.x,y:s.y});}}
export function hitMonsterAttack(s,a){
 const m=s.hero.monster,power=monsterPower(m?.level),spec=monsterAttacks[a.kind],hits=(o,r=0)=>monsterAttackHits(a,o.x,o.y,r),heightHit=(o,h=25,base=0)=>a.kind!=='beam'||beamHeightAt(a,o.x,o.y)>=base-spec.width/2&&beamHeightAt(a,o.x,o.y)<=base+h+spec.width/2;
 for(const b of world.solids){
  if(!Number.isFinite(b.hp)||isDestroyed(s,b.id)||!cityObjectActive(s,b)||!hits(b,Math.min(100,Math.hypot(b.w??12,b.d??12)/2))||!heightHit(b,b.h??25))continue;
  const amount=spec.damage*3.4*power.damage;
  if(b.kind==='building')hurtBuilding(s,b,amount);else{const before=s.damage[b.id]??0;s.damage[b.id]=Math.min(b.hp,before+amount/cityArmor(s,b));if(before<b.hp&&s.damage[b.id]>=b.hp){s.destroyedCount++;s.events.push({...b,type:'object-break',time:s.time});}}
 }
 const height=(s.deck??0)+(s.z??0),heightLimit=a.kind==='meteor'?Infinity:a.kind==='slash'?100:70;
 if((a.kind==='beam'||height<heightLimit)&&hits(s,vehicleStats(s).r)&&heightHit(s,s.vehicle===10?160:30,height))combatDamage(s,spec.damage*power.damage);
 for(const person of s.crowd?.people??[])if(!s.struck.has(person.id)&&hits(person,5)&&heightHit(person,18))harmCitizen(s,person);
 for(const car of [...(s.traffic??[]),...(s.responses??[]),...(s.pursuit?.cars??[])])if(car.health>0&&hits(car,16)&&heightHit(car,28,car.deck??0))damageTraffic(car,spec.damage*2*power.damage,s.time);
 combatEffect(s,'monster-'+a.kind,a.targetX,a.targetY,spec.radius??spec.range);Object.assign(s.combatEffects.at(-1),{attack:{...a}});
 s.lastMonsterAttack={kind:a.kind,at:s.time};s.events.push({type:'monster-'+a.kind,x:a.targetX,y:a.targetY,time:s.time});s.weaponTraceRevision=(s.weaponTraceRevision??0)+1;
}
export function updateMonsterProjectiles(s,dt){
 const m=s.hero.monster;if(!m)return;
 m.projectiles??=[];for(const p of m.projectiles){p.remaining=Math.max(0,p.remaining-dt);if(!p.remaining)hitMonsterAttack(s,p);}
 m.projectiles=m.projectiles.filter(p=>p.remaining>0);
}
export function weaponAim(s,w=activeWeapon(s)){if(!w||s.broken)return null;return weaponTrace(s,w);}
export function updateShells(s,dt){
 s.shells??=[];for(const shell of s.shells){shell.elapsed+=dt;const t=Math.min(1,shell.elapsed/shell.duration);shell.x=shell.origin.x+(shell.end.x-shell.origin.x)*t;shell.y=shell.origin.y+(shell.end.y-shell.origin.y)*t;shell.height=shell.origin.height+(shell.end.height-shell.origin.height)*t+Math.sin(t*Math.PI)*24;
 if(t<1)continue;shell.done=true;const x=shell.end.x,y=shell.end.y,m=s.hero.monster;
 for(const b of world.solids){if(!Number.isFinite(b.hp)||isDestroyed(s,b.id)||Math.hypot(b.x-x,b.y-y)>72+Math.min(b.w??12,b.d??12)/2)continue;const amount=220*Math.max(.2,1-Math.hypot(b.x-x,b.y-y)/110);if(b.kind==='building')hurtBuilding(s,b,amount);else{const before=s.damage[b.id]??0;s.damage[b.id]=Math.min(b.hp,before+amount/cityArmor(s,b));if(before<b.hp&&s.damage[b.id]>=b.hp){s.destroyedCount++;s.events.push({...b,type:'object-break',time:s.time});}}}
 for(const car of [...(s.traffic??[]),...(s.responses??[]),...(s.pursuit?.cars??[])])if(car.health>0&&Math.hypot(car.x-x,car.y-y)<80)damageTraffic(car,230,s.time);
 for(const person of s.crowd?.people??[])if(Math.hypot(person.x-x,person.y-y)<55&&harmCitizen(s,person,true)&&!s.struck.get(person.id)?.survived)dispatchAmbulance(s,s.struck.get(person.id));
 if(m&&m.phase!=='retreating'&&Math.hypot(m.x-x,m.y-y)<120){m.hp=Math.max(0,m.hp-cannonSpec.damage);m.hitAt=s.time;s.hero.career.shellHits++;}
 combatEffect(s,'cannon',x,y,80);s.lastWeaponEffect=s.time;s.weaponTraceRevision=(s.weaponTraceRevision??0)+1;
 }s.shells=s.shells.filter(p=>!p.done);}
export function updateCombat(s,dt,firing=false){
 s.combatEffects=(s.combatEffects??[]).filter(e=>s.time-e.at<(e.kind==='stomp'||e.kind==='monster-stomp'||e.kind==='monster-meteor'?3.2:1.1));
 checkMonsterDeadline(s);const h=s.hero,m=h.monster;s.weaponFlash=Math.max(0,(s.weaponFlash??0)-dt);s.weaponCooldown=Math.max(0,(s.weaponCooldown??0)-dt);
 const w=activeWeapon(s);s.attackBeam=null;updateShells(s,dt);
 if(w?.id==='cannon'&&firing&&!s.broken&&s.z<4&&s.weaponCooldown<=0){const trace=weaponTrace(s,w,true);s.weaponCooldown=w.cooldown;s.weaponFlash=.16;s.lastCannonAt=s.time;const origin=trace.origin;s.shells.push({origin:{...origin},end:{x:trace.x,y:trace.y,height:trace.height},x:origin.x,y:origin.y,height:origin.height,elapsed:0,duration:Math.max(.09,Math.hypot(trace.x-origin.x,trace.y-origin.y)/640)});s.events.push({type:'cannon-shot',time:s.time,x:s.x,y:s.y});}
 const attackReady=s.vehicle===10?updateRobotAttack(s,dt,firing):firing;
 if(attackReady&&w&&w.id!=='cannon'&&!s.broken&&s.z<4){
  if(w.id==='robot-rifle'&&s.weaponCooldown<=0)s.robotShotAt=s.time;
  const trace=weaponTrace(s,w,s.weaponCooldown<=0||s.vehicle===10);s.attackBeam={x:trace.origin.x,y:trace.origin.y,end:{x:trace.x,y:trace.y},kind:w.id,color:w.color,height:trace.height,originHeight:trace.origin.height};
  const sword=w.id==='beam-sword',targets=sword?trace.hits.filter(hit=>!(s.robotSwingTargets??[]).includes(hit.type+':'+(hit.target.id??'monster'))):trace.hits;
  if((sword&&targets.length)||(!sword&&s.weaponCooldown<=0)){s.weaponCooldown=w.cooldown;s.weaponFlash=.10;s.robotAttackAt=s.time;s.robotAction=w.id==='beam-sword'?'slash':'shoot';const amount=w.damage*w.cooldown,monsterBefore=m?.hp;
   for(const hit of targets){const target=hit.target;if(sword)(s.robotSwingTargets??=[]).push(hit.type+':'+(target.id??'monster'));
    if(hit.type==='object'){const multiplier=w.id==='beam-sword'?3.5:w.id==='robot-rifle'?1.8:w.id==='saw'?2.1:w.id==='flame'?1.4:.8;if(target.kind==='building')hurtBuilding(s,target,amount*multiplier);else{const before=s.damage[target.id]??0;s.damage[target.id]=Math.min(target.hp,before+amount*multiplier/cityArmor(s,target));if(before<target.hp&&s.damage[target.id]>=target.hp){s.destroyedCount++;s.events.push({type:'object-break',id:target.id,x:target.x,y:target.y,w:target.w,d:target.d,h:target.h,material:target.material,time:s.time});}}}
    else if(hit.type==='car')damageTraffic(target,amount,s.time);
    else if(hit.type==='monster'&&target.phase!=='retreating'){target.hp=Math.max(0,target.hp-amount);target.hitAt=s.time;}
    else if(hit.type==='person'&&!s.struck.has(target.id)){harmCitizen(s,target,true);if(!s.struck.get(target.id)?.survived)dispatchAmbulance(s,s.struck.get(target.id));}
   }
   s.weaponTraceRevision=(s.weaponTraceRevision??0)+1;combatEffect(s,w.id,trace.x,trace.y,w.id==='beam-sword'?75:30);Object.assign(s.combatEffects.at(-1),{height:trace.height,origin:{...trace.origin},heading:trace.angle,hit:targets.length>0,targets:targets.map(hit=>({type:hit.type,id:hit.target.id??null})),monsterDamage:m?Math.max(0,monsterBefore-m.hp):0});s.lastWeaponEffect=s.time;
  }
 }

 if(!m)return;
 if(updateRetreat(s,dt))return;
 if(m.hp<=0){
  const reward=900+Math.min(3300,h.raids*110);h.raids++;h.nextRaid=Math.max(h.day+raidDelay(h.raids),h.nextRaid+3);h.monster=null;s.points+=reward;h.totalEarned+=reward;h.growth+=25;h.result={type:'victory',day:h.day,reward,population:population(s)};
  s.events.push({type:'hero-victory',x:m.x,y:m.y,time:s.time});heroNotice(s,'怪獣撃退！ 防衛報酬 '+reward+' pt。街に25人が戻りました。');return;
 }
 if(updateApproach(s,dt))return;
 updateMonsterProjectiles(s,dt);
 const power=monsterPower(m.level);m.cooldown=Math.max(0,m.cooldown-dt);
 monsterContact(s,m,{x:m.x,y:m.y});
 for(const car of [...(s.traffic??[]),...(s.responses??[]),...(s.pursuit?.cars??[])]){
  if(car.health<=0||Math.hypot(car.x-m.x,car.y-m.y)>80||(car.monsterContactAt??-99)+1>s.time)continue;
  car.monsterContactAt=s.time;const force=Math.min(90,Math.max(6,Math.abs(car.speed??0)*.35));damageTraffic(car,40+force,s.time);m.hp=Math.max(0,m.hp-force);m.hitAt=s.time;car.speed=0;combatEffect(s,'contact',car.x,car.y,42);
 }
 if(m.windup>0){m.walking=false;m.windup=Math.max(0,m.windup-dt);if(m.windup===0){
   const impact=m.strike??m,a=m.attack??aimMonsterAttack(m,impact,'stomp');
   if(a.kind==='meteor'){
    // Broad random town strikes, chosen at cast time, never aimed at the defender.
    for(const [i,target] of (a.targets??scatterMeteorTargets(m)).entries()){if(m.projectiles.length>=9)break;const duration=1.8+i*.1;m.projectiles.push({kind:'meteor',x:a.x,y:a.y,angle:a.angle,targetX:target.x,targetY:target.y,duration,remaining:duration});}
    s.lastMonsterAttack={kind:'meteor-cast',at:s.time};
   }else hitMonsterAttack(s,a);
   m.lastAttack=a.kind;m.cooldown=power.cooldown;m.attack=null;m.strike=null;m.target=null;m.targetPerson=null;m.chooseAt=0;
  }return;}
 const goal=monsterGoal(s);if(!goal){m.walking=false;return;}
 const d=Math.hypot(goal.x-m.x,goal.y-m.y);m.heading=Math.atan2(goal.y-m.y,goal.x-m.x);
 const old={x:m.x,y:m.y};m.walking=d>95;
 const kind=m.cooldown<=0?chooseMonsterAttack(m,d):null;
 if(kind){m.attack=armMonsterAttack(m,goal,kind);m.windup=monsterAttacks[kind].windup;m.strike={x:m.attack.targetX,y:m.attack.targetY};m.walking=false;}
 else if(m.walking)walkMonster(s,m,goal,dt,95);
 monsterContact(s,m,old);
 if(s.broken&&!h.defeatShown){h.defeatShown=true;h.result={type:'defeat',day:h.day};heroNotice(s,'マシンが大破。整備所で復帰し、再び防衛に向かおう。');}
 if(!s.broken)h.defeatShown=false;
}
const raidDelay=()=>3;
