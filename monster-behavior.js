import {world,isDestroyed,WEST_EDGE,SIZE} from './world.js?v=5.6.0';

// A full game day: independent of simulation age, pause, and save/reload.
export const monsterDaySeconds=480;
export const heroClock=h=>(h.day-1)*monsterDaySeconds+h.clock;
export function monsterPower(level=0){
 level=Math.max(0,Math.floor(level));
 const elite=(level+1)%5===0;
 return {maxHp:Math.min(60000,Math.round((1600+level*320+level*level*16)*(elite?1.2:1))),speed:37+Math.min(53,level*1.6),damage:Math.min(5,(1+level*.12)*(elite?1.12:1)),cooldown:Math.max(.65,1.4-level*.025),elite};
}
export function restoreMonster(h){
 h.raidVisits??=h.raids+(h.monster?1:0);
 const m=h.monster;if(!m)return;
 m.level??=Math.max(0,h.raidVisits-1);m.enteredAt??=heroClock(h);m.phase??='active';
}
export function beginRetreat(s){
 const h=s.hero,m=h.monster;if(!m||m.phase==='retreating'||m.hp<=0)return false;
 m.phase='retreating';m.windup=0;m.strike=null;m.attack=null;m.projectiles=[];m.target=null;m.targetPerson=null;m.walking=true;
 m.exit={x:m.kind===0?WEST_EDGE-320:SIZE.w+320,y:Math.max(0,Math.min(SIZE.h,m.y))};
 h.guideMonster=false;s.weaponTraceRevision=(s.weaponTraceRevision??0)+1;
 s.heroNotice='怪獣が撤退を開始。いまは攻撃が通じない。街の外へ向かっています。';
 s.events.push({type:'monster-retreat',x:m.x,y:m.y,time:s.time});return true;
}
export function checkMonsterDeadline(s){
 const m=s.hero.monster;if(!m)return;restoreMonster(s.hero);
 if(m.phase!=='approaching'&&heroClock(s.hero)-m.enteredAt>=monsterDaySeconds)beginRetreat(s);
}
export function updateApproach(s,dt){
 const m=s.hero.monster;if(m?.phase!=='approaching')return false;
 const entrance={x:m.kind===0?WEST_EDGE+20:SIZE.w-20,y:m.kind===0?1000:4900};
 // Fifteen seconds of visible advance warning, independent of wave speed.
 const speed=monsterPower(m.level).speed;
 if(walkMonster(s,m,entrance,dt*18/speed)<1){m.phase='active';m.enteredAt=heroClock(s.hero);m.cooldown=.7;s.heroNotice='怪獣が街に侵入！ 市民と建物を守ろう。';s.events.push({type:'monster-arrived',x:m.x,y:m.y,time:s.time});}
 return true;
}
export function walkMonster(s,m,goal,dt,stop=0){
 const dx=goal.x-m.x,dy=goal.y-m.y,d=Math.hypot(dx,dy),step=Math.min(Math.max(0,d-stop),monsterPower(m.level).speed*dt);
 m.walking=step>0;if(!m.walking)return d;
 m.heading=Math.atan2(dy,dx);m.x+=Math.cos(m.heading)*step;m.y+=Math.sin(m.heading)*step;m.walkDistance=(m.walkDistance??0)+step;
 const foot=Math.floor(m.walkDistance/38);if(foot!==(m.lastFoot??0)){m.lastFoot=foot;(s.combatEffects??=[]).push({kind:'foot',x:m.x+Math.sin(m.heading)*(foot%2?30:-30),y:m.y-Math.cos(m.heading)*(foot%2?30:-30),size:42,at:s.time});}
 return d-step;
}
export function updateRetreat(s,dt){
 const h=s.hero,m=h.monster;if(m?.phase!=='retreating')return false;
 m.exit??={x:m.kind===0?WEST_EDGE-320:SIZE.w+320,y:Math.max(0,Math.min(SIZE.h,m.y))};
 if(walkMonster(s,m,m.exit,dt)<1){
  h.monster=null;h.nextRaid=Math.max(h.day+3,h.nextRaid+3);h.result={type:'retreat',day:h.day,reward:0};
  s.heroNotice='怪獣は街の外へ去りました。次の襲来に備えよう。';
  s.events.push({type:'monster-departed',x:m.x,y:m.y,time:s.time});
 }return true;
}
export function monsterGoal(s,random=Math.random){
 const h=s.hero,m=h.monster,now=heroClock(h),people=s.crowd?.people??[];
 let target=m.targetPerson?people.find(p=>p.id===m.targetPerson&&!s.struck.has(p.id)):world.byId.get(m.target);
 if(!target||(!m.targetPerson&&isDestroyed(s,target.id))||now>=(m.chooseAt??-1)){
  const distance=p=>Math.hypot(p.x-m.x,p.y-m.y),nearest=list=>list.sort((a,b)=>distance(a)-distance(b)).slice(0,8);
  const citizens=nearest(people.filter(p=>!s.struck.has(p.id)&&distance(p)<900));
  const buildings=nearest(world.buildings.filter(b=>b.kind==='building'&&!isDestroyed(s,b.id)));
  const pool=citizens.length&&(!buildings.length||random()<.45)?citizens:buildings;
  target=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
  m.target=target&&pool===buildings?target.id:null;m.targetPerson=target&&pool===citizens?target.id:null;m.chooseAt=now+8+random()*8;
 }
 // React to a nearby defender, but otherwise continue attacking the town.
 const distanceToDefender=Math.hypot(s.x-m.x,s.y-m.y),provoked=m.hitAt!==undefined&&s.time-m.hitAt<4&&distanceToDefender<850;
 return !s.broken&&(distanceToDefender<290||provoked)?s:target;
}
