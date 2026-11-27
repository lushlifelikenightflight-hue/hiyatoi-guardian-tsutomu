import {jobPayout} from './balance-tuning.js?v=5.6.1';
import {extraJobTypes,extraContract} from './extra-jobs.js?v=5.6.1';
import {moveToChallengeStart} from './challenge-start.js?v=5.6.1';
import {roadside,variedContract,demolitionContract,rememberJob} from './job-contracts.js?v=5.6.1';
import {world,isDestroyed,civicSites,destinations,responseRoadPath} from './world.js?v=5.6.1';
import {rankJob} from './hero-life.js?v=5.6.1';
import {captureService,serviceCompletion,serviceSeconds} from './job-service.js?v=5.6.1';

export const jobTypes=[
 {id:'taxi',name:'タクシーの送迎',vehicle:6,reward:180},
 {id:'bus',name:'バス停の巡回',vehicle:2,reward:360},
 {id:'mail',name:'ポストへの配達',vehicle:1,reward:240},
 {id:'demolition',name:'指定建物の解体',vehicle:5,reward:300},
 {id:'fire',name:'火災現場の消火',vehicle:7,reward:380},
 {id:'ambulance',name:'救護と病院への搬送',vehicle:8,reward:420},
 ...extraJobTypes
];
export function availableJob(s,id,{fixed=false,random=Math.random}={}){
 const spec=jobTypes.find(j=>j.id===id);
 if(!spec)return null;
 if(extraJobTypes.some(j=>j.id===id))return extraContract(s,spec,random);
 if(id==='fire'||id==='ambulance'){
  const choices=world.buildings.filter(b=>b.kind==='building'&&!b.landmark&&!isDestroyed(s,b.id));
  let b=id==='fire'?world.byId.get(s.hero.fires[0]?.id):null;
  if(!b){const pool=choices.filter(b=>b.id!==s.hero.lastCall);b=pool[Math.floor(random()*pool.length)%pool.length];}
  const p=b&&roadside(b,16);if(!p)return null;
  const first={...p,id:(id==='fire'?'fire-':'rescue-')+b.id,name:id==='fire'?'火災現場・停車して放水':'救護現場・負傷者を収容',siteX:b.x,siteY:b.y,fireBuilding:id==='fire'?b.id:null};
  const hospital=civicSites.find(p=>p.type==='hospital');
  const stops=id==='fire'?[first]:[first,{id:'hospital-drop',name:'あさひ総合病院・搬送入口',x:hospital.x,y:hospital.y,siteX:hospital.bx,siteY:hospital.by}];
  const length=stops.reduce((n,p,i)=>n+(responseRoadPath(p.x,p.y,[i?stops[i-1]:s])?.distance??Math.hypot(p.x-s.x,p.y-s.y)),0),plannedMetres=Math.round(length*.12);
  return {...spec,stops,index:0,hold:0,passengers:0,service:null,plannedMetres,serviceDuration:fixed?1.5:id==='fire'?5:2.5,reward:fixed?spec.reward:Math.ceil((spec.reward+plannedMetres*.3)*1.15/10)*10};
 }
 let stops;
 if(!fixed){const quote=id==='demolition'?demolitionContract(s,random):variedContract(s,id,random);return quote?{...spec,...quote,index:0,hold:0,passengers:0,service:null}:null;}
 if(id==='demolition'){
  const buildings=world.buildings.filter(b=>b.kind==='building'&&b.demolitionSite&&b.vacant&&!isDestroyed(s,b.id));
  buildings.sort((a,b)=>Math.hypot(s.x-a.x,s.y-a.y)-Math.hypot(s.x-b.x,s.y-b.y));
  const b=buildings.find(b=>roadside(b,14));
  if(!b)return null;
  stops=[{...roadside(b,14),id:b.id,name:'指定建物',building:b.id}];
 }else if(id==='taxi'){
  const locations=[{id:'pickup-station',name:'駅前の乗客',x:2260,y:1390},{id:'drop-park',name:'風待ち公園入口',x:2240,y:1670}];
  stops=locations.map(o=>({...o,...roadside(o)}));
 }else{
  stops=world.props.filter(p=>p.job===id&&(!fixed||id!=='bus'||['bus-station','bus-castle','bus-farm','bus-hill'].includes(p.id))&&(!fixed||id!=='mail'||['post-station','post-west','post-farm','post-hill'].includes(p.id))).map(p=>({id:p.id,name:id==='bus'?'バス停':'配達先のポスト',siteX:p.x,siteY:p.y,...roadside(p,id==='bus'?15:12)}));
  stops.sort((a,b)=>Math.hypot(s.x-a.x,s.y-a.y)-Math.hypot(s.x-b.x,s.y-b.y));
 }
 if(!stops?.length||stops.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 return {...spec,stops,index:0,hold:0,passengers:0,service:null};
}
export function jobTarget(s){
 const job=s.work;
 if(!job)return null;
 const stop=job.stops[job.index];
 return {...stop,id:'work-'+stop.id,name:job.id==='taxi'?(job.index===0?'乗車：':'送迎先：')+stop.name:stop.name};
}
export function updateJob(s,dt){
 const job=s.work;
 if(!job)return null;
 if(s.broken){s.work=null;s.workAuto=false;s.jobEffect=null;return {type:'failed'};}
 job.elapsed=(job.elapsed??0)+dt;job.damageStart??=s.totalDamage??0;
 if(s.vehicle!==job.vehicle){job.hold=0;job.service=null;return null;}
 if(job.timeLimit&&job.elapsed>job.timeLimit){s.work=null;s.workAuto=false;s.jobEffect=null;return {type:'failed',reason:'制限時間終了。もう一度仕事ボタンで挑戦できます。'};}
 const goal=job.stops[job.index];
 let completed;
 if(job.passThrough)completed=Math.hypot(s.x-goal.x,s.y-goal.y)<42;
 else if(goal.building)completed=isDestroyed(s,goal.building);
 else{
  const stopped=s.z+(s.deck??0)<1&&Math.abs(s.speed)<3&&Math.hypot(s.x-goal.x,s.y-goal.y)<32;
  if(stopped&&!job.service)job.service=captureService(s,job,goal);
  if(!stopped)job.service=null;
  job.hold=stopped?job.hold+dt:0;
  completed=job.hold>=(job.serviceDuration??serviceSeconds);
 }
 if(!completed)return null;
 if(goal.fireBuilding){s.hero.fires=s.hero.fires.filter(f=>f.id!==goal.fireBuilding);s.damage[goal.fireBuilding]=Math.max(0,(s.damage[goal.fireBuilding]??0)-80);}
 const snapshot=job.service??captureService(s,job,goal),finished=job.index===job.stops.length-1;
 const message=serviceCompletion(snapshot,finished);
 s.jobEffect={...snapshot,...message,at:s.time,reward:finished?job.reward:0};
 job.passengers=Math.max(0,(job.passengers??0)+snapshot.board-snapshot.alight);
 job.index++;job.hold=0;job.service=null;
 if(!finished)return {type:'stop',...message};
 const rating=rankJob(job,s),reward=jobPayout(s,job,s.workAuto?rating.multiplier:1);
 s.points=Math.min(Number.MAX_SAFE_INTEGER,s.points+reward);
 s.hero.lastRank={...rating,reward};s.hero.totalEarned+=reward;s.hero.jobCount++;
 s.jobEffect={...s.jobEffect,label:'仕事完了　ランク '+rating.rank,detail:message.detail+'　'+rating.seconds+'秒 ／ ダメージ '+rating.damage+' HP'+(s.workAuto?'　次の依頼を受注':'') ,reward};
 s.workReceipt={...s.jobEffect};
 s.work=null;
 if(s.workAuto&&!startWork(s,job.id))s.workAuto=false;
 return {type:'paid',...message,reward,rank:rating.rank};
}
export function startWork(s,id,offer=null){
 const job=offer??availableJob(s,id);if(!job||s.broken||s.vehicle!==job.vehicle||s.hero.owned[s.vehicle]===false)return false;
 if(id==='race'&&!moveToChallengeStart(s,job.stops[0],Math.atan2(job.stops[1].y-job.stops[0].y,job.stops[1].x-job.stops[0].x)))return false;
 rememberJob(s,job);job.elapsed=0;job.damageStart=s.totalDamage??0;s.work=job;s.workAuto=true;s.serviceGuide=null;
 if(id==='fire'){const b=world.byId.get(job.stops[0].fireBuilding);if(b&&!s.hero.fires.some(f=>f.id===b.id))s.hero.fires.push({id:b.id,power:1});}
 s.hero.lastCall=job.stops[0].fireBuilding??job.stops[0].id.replace(/^rescue-/, '');return true;
}
export function stopWork(s){s.work=null;s.workAuto=false;s.jobEffect=null;s.serviceGuide=null;}
