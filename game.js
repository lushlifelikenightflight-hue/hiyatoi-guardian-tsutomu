import {mountWorkCompass} from './work-compass.js?v=5.6.1';
import {mountSaveTransfer} from './save-transfer.js?v=5.6.1';
import {mountTitleFlow} from './title-flow.js?v=5.6.1';
import {readResume,beginNewSave} from './title-session.js?v=5.6.1';
import {mountCityCareer} from './city-career-ui.js?v=5.6.1';
import {cityObjectActive} from './city-evolution.js?v=5.6.1';
import {lessons,tutorialReady,finishLesson,updateMedals,medals} from './career-progress.js?v=5.6.1';
import {vehicleIntroduction} from './vehicle-talk.js?v=5.6.1';
import {machinePrice} from './economy.js?v=5.6.1';
import {garageContaining} from './garage-sites.js?v=5.6.1';
import {loadPixelVfx} from './pixel-vfx.js?v=5.6.1';
import {bindButtonGuards} from './button-guards.js?v=5.6.1';
import {updateWeatherHazards} from './weather-effects.js?v=5.6.1';
import {meeting,raidMessage,mountNarration} from './tsutomu-story.js?v=5.6.1';
import {chooseMusicScene} from './music-scene.js?v=5.6.1';
import {updateLife,daySeconds,weaponSpecs,population} from './hero-life.js?v=5.6.1';
import {updateCombat} from './hero-combat.js?v=5.6.1';
import {mountHeroHud} from './hero-ui.js?v=5.6.1';
import {railSurface,enteredRailGuide,exitedRailGuide,railAccessPoints} from './rail-drive.js?v=5.6.1';
let chaseResult=null;
import {rememberJob} from './job-contracts.js?v=5.6.1';
import {servicePhase,jobFeedbackSeconds} from './job-service.js?v=5.6.1';
import {guidanceTarget} from './road-guidance.js?v=5.6.1';
import {moveToChallengeStart} from './challenge-start.js?v=5.6.1';
import {mountGarage} from './garage-ui.js?v=5.6.1';
import {garageAt} from './upgrades.js?v=5.6.1';
import {jobTypes,availableJob,jobTarget,updateJob,startWork,stopWork} from './jobs.js?v=5.6.1';
import {groundHeight,roadGrade} from './elevation.js?v=5.6.1';
import {beginPursuit,chaseLimit,escapeStart,pursuitGoal,updatePursuit} from './pursuit.js?v=5.6.1';
import {beginParkTrial,parkGates,updateParkTrial} from './park-trial.js?v=5.6.1';
import {ambulanceVisible,dispatchAmbulance,updateAmbulances} from './ambulance.js?v=5.6.1';
import {bodyOpacity, WRECK_DURATION} from './wreckage.js?v=5.6.1';
import {DriveSound} from './drive-sound.js?v=5.6.1';
import {createPedestrians,updatePedestrians} from './pedestrians.js?v=5.6.1';
import {SceneMusic} from './music.js?v=5.6.1';
import {createTraffic,updateTraffic} from './traffic.js?v=5.6.1';
import {bindPedals} from './drive-controls.js?v=5.6.1';
import {Renderer} from './renderer.js?v=5.6.1';
import {vehicles,vehicleStats,createState,step,rescue,repair,recoverySites,switchVehicle,decodeSave,encodeSave,destroyedCount,rebuildTown,collideWithTraffic} from './physics.js?v=5.6.1';
import {mapView} from './map-view.js?v=5.6.1';
import {NORTH_LIMIT} from './south.js?v=5.6.1';
import {spots,destinations,SPAWN,world} from './world.js?v=5.6.1';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),local=['127.0.0.1','localhost'].includes(location.hostname),qa=false;
bindButtonGuards(document,window);
const workCompass=mountWorkCompass(document.getElementById('game'));
const saveKey=qa?'komorebi-drive-test-expansion-v2'+(params.get('suite')==='features'?'-features':''):'komorebi-drive-v1';
const trialKey=saveKey+'-park-record';
let trialBest=null;
try{const raw=Number(localStorage.getItem(trialKey));if(Number.isFinite(raw)&&raw>0)trialBest=raw;}catch{}
let stored=null;
try{
 const raw=localStorage.getItem(saveKey);
 stored=decodeSave(raw);
 if(stored?.migrated){
  const backup=saveKey+(stored.version===12?'-before-destroyking':stored.worldRevision!==6?(stored.worldRevision===5?'-before-large-sites':stored.worldRevision===4?'-before-city-lots':'-before-pocket-parks'):stored.version===11?'-before-hero-life':stored.version===10?'-before-bus-network':stored.version===9?'-before-bus-demolition-contracts':stored.version===8?'-before-job-variety':stored.version===7?'-before-garage-upgrades':stored.version===6?'-before-city-upgrade':stored.version===5?'-before-recovery-bays':stored.version===4?'-before-southern-expansion':stored.version===3?'-before-street-fronts':stored.version===2?'-before-district-redesign':'-before-expansion');
  if(!localStorage.getItem(backup))localStorage.setItem(backup,raw);
 }
}catch{}
const state=createState(stored),renderer=new Renderer($('scene')),keys=new Set();
state.traffic=createTraffic(state);
state.crowd=createPedestrians(state.time);
updatePedestrians(state.crowd,state.traffic,state,state.time,0);
const touch=bindPedals($('game'),window,()=>started&&!paused&&!map&&!photo&&!state.broken&&!storyGate);
const clearInput=()=>{keys.clear();touch.clear();state.attackPulse=0;};
let trafficElapsed=0,audioStarting=false;
let driveSoundEnabled=true;
const heardWrecks=new WeakMap();
try{driveSoundEnabled=localStorage.getItem(qa?'komorebi-drive-audio-test':'komorebi-drive-audio')!=='off';}catch{}
async function enableDriveSound(){
 if(!driveSoundEnabled||audioStarting||audio)return;
 audioStarting=true;
 let context;
 try{
  context=new AudioContext();
  await context.resume();
  if(driveSoundEnabled)audio=new DriveSound(context);
  else await context.close();
 }catch{
  if(context&&context.state!=='closed')void context.close().catch(()=>{});
  driveSoundEnabled=false;
  notify('走行音を開始できませんでした。');
 }finally{
  audioStarting=false;
  $('audio-button').textContent=driveSoundEnabled?'走行音をオフにする':'走行音をオンにする';
 }
}

let started=false,paused=false,photo=false,map=false,target=spots.find(p=>!state.collected.has(p.id))?.id??'pond',toastUntil=0,last=performance.now(),accumulator=0,uiTick=0,saveTick=0,lastFocus=null,qaInput=null,qaFreeze=false,driver=null,audio=null;
let transferPreviousPause=false,transferReplacing=false,sessionWritable=false;
mountSaveTransfer({state,key:saveKey,getBest:()=>trialBest,onOpen:()=>{transferPreviousPause=paused;paused=true;clearInput();},onClose:()=>{paused=transferPreviousPause;},onReplacing:value=>{transferReplacing=value;}});
let storyGate=false,storyFixture=false,announcedMonster=null,currentVehicleTalk=null;
const narration=mountNarration({onClose:kind=>{storyGate=false;clearInput();if(kind==='intro')state.hero.introSeen=true;if(kind==='tutorial')finishLesson(state);if(kind==='vehicle'&&currentVehicleTalk!==null){state.hero.vehicleTalks??=[0,1];if(!state.hero.vehicleTalks.includes(currentVehicleTalk))state.hero.vehicleTalks.push(currentVehicleTalk);currentVehicleTalk=null;}save();updateUI();(garageOpen?$('close-garage'):$('pause-button')).focus();}});
function maybeVehicleTalk(){if(storyGate||progressUI.mode||!started||map||photo||!state.pendingVehicleTalks?.length)return;const index=state.pendingVehicleTalks.shift();if(state.hero.vehicleTalks?.includes(index))return;currentVehicleTalk=index;storyGate=true;clearInput();$('toast').hidden=true;narration.open('vehicle',vehicleIntroduction(index));}
function showTutorial(){storyGate=true;clearInput();$('toast').hidden=true;requestAnimationFrame(()=>{if(storyGate)narration.open('intro',meeting);});}
function showRaidWarning(){const m=state.hero.monster;if(!m||m.phase==='retreating')return;announcedMonster=m;state.hero.guideMonster=true;state.serviceGuide=null;state.trial=null;state.pursuit=null;syncChallengeControls();storyGate=true;clearInput();$('toast').hidden=true;requestAnimationFrame(()=>{if(storyGate)narration.open('raid',raidMessage(m));});syncMusic();}
const musicKey=qa?'komorebi-bgm-test':'komorebi-bgm';
let music=null,bgmEnabled=true;
try{bgmEnabled=localStorage.getItem(musicKey)!=='off';}catch{}
function musicScene(){return chooseMusicScene({hidden:document.hidden,enabled:bgmEnabled,started,monster:Boolean(state.hero.monster),paused,map,photo,broken:state.broken,night:renderer.mode==='night'});}
function syncMusic(){
 music?.setScene(musicScene());
 const active=!!music?.scene&&music.context.state==='running';
 $('opening-sound').textContent=active?'BGM：ON':bgmEnabled?'音を出す':'BGM：OFF';$('opening-sound').setAttribute('aria-pressed',String(active));
 $('title-music').textContent=active?'BGM：ON':'BGM：OFF';
 $('bgm-button').textContent=active?'BGM：ON':'BGM：OFF';
 for(const id of ['title-music','bgm-button'])$(id).setAttribute('aria-pressed',String(active));
 if(qa)$('game').dataset.bgmScene=music?.scene??'off';
}
async function unlockMusic(){
 if(!bgmEnabled)return;
 try{
  music??=new SceneMusic(new AudioContext());
  music.context.onstatechange=syncMusic;
  syncMusic();
  await music.context.resume();
  syncMusic();
 }catch{notify('このブラウザーではBGMを再生できません。');}
}
function openingSound(){if(!music?.scene||music.context.state!=='running'){bgmEnabled=true;try{localStorage.setItem(musicKey,'on');}catch{}void unlockMusic();}else toggleMusic();}
function toggleMusic(){
 bgmEnabled=!(music?.scene&&music.context.state==='running');
 try{localStorage.setItem(musicKey,bgmEnabled?'on':'off');}catch{}
 if(bgmEnabled)void unlockMusic();else syncMusic();
}
const bootStarted=performance.now(),metrics={frames:0,elapsed:0,frameMs:[],drawMs:[],errors:[],assetReady:false,bootMs:0,spikes:[],frameGaps:[],saveMs:[],simulationMs:[],uiMs:[]};
window.addEventListener('error',e=>metrics.errors.push(e.message));window.addEventListener('unhandledrejection',e=>metrics.errors.push(String(e.reason)));
function notify(text,duration=4){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+duration*1000;}
function save(){if(transferReplacing||!sessionWritable)return;const at=performance.now();try{localStorage.setItem(saveKey,encodeSave(state));}catch{$('save-status').textContent='このブラウザーでは保存できません。今回のドライブはそのまま続けられます。';}finally{if(metrics.saveMs.length<400)metrics.saveMs.push(performance.now()-at);}}
function hud(visible){document.querySelectorAll('.hud').forEach(el=>el.hidden=!visible);if(visible){$('touch-controls').hidden=false;}}
function start({skipIntro=false}={}){sessionWritable=true;front.playing();storyFixture=qa&&skipIntro;started=true;void unlockMusic();void enableDriveSound();paused=false;$('intro').hidden=true;hud(true);renderer.camera.x=state.x;renderer.camera.y=state.y;renderer.camera.z=groundHeight(state.x,state.y);save();updateUI();if(!skipIntro&&!state.hero.introSeen)showTutorial();else if(state.hero.monster&&!storyFixture)showRaidWarning();else $('toast').hidden=true;}
function resetRun(next){Object.assign(state,next);state.traffic=createTraffic(state);state.crowd=createPedestrians(state.time);updatePedestrians(state.crowd,state.traffic,state,state.time,0);trafficElapsed=0;announcedMonster=null;lastGarageInside=garageContaining(state)?.id;garageEntryPending=false;target='station';chaseResult=null;currentVehicleTalk=null;clearInput();syncChallengeControls();}
const front=mountTitleFlow({hasResume:()=>Boolean(readResume(localStorage,saveKey)),hasRaw:()=>{try{return localStorage.getItem(saveKey)!==null;}catch{return false;}},onGesture:()=>void unlockMusic(),onSound:openingSound,onContinue:()=>{start();},onNew:()=>{const next=beginNewSave(localStorage,saveKey);trialBest=null;resetRun(next);start();}});
void unlockMusic();
syncMusic();
function returnTitle(){save();started=false;sessionWritable=false;paused=false;clearInput();$('menu').hidden=true;$('toast').hidden=true;hud(false);$('touch-controls').hidden=true;front.returnTitle();updateUI();syncMusic();}
function setMenu(open){paused=open;clearInput();$('menu').hidden=!open;if(open){refreshJobOffers();lastFocus=document.activeElement;$('close-menu').focus();}else{lastFocus?.focus();}}
let garageOpen=false,garageReturnMenu=false,vehiclePicker=false,lastGarageInside=garageContaining(state)?.id,garageEntryPending=false;
let progressionReturn=false,medalTick=0;
const progressUI=mountCityCareer({state,onChoose:c=>{if(c.effect.traffic)state.traffic=createTraffic(state);if(world.solids.some(o=>cityObjectActive(state,o)&&o.evolutionReserve&&Math.hypot(o.x-state.x,o.y-state.y)<Math.max(o.w??16,o.d??16)+35))rescue(state);paused=progressionReturn;clearInput();save();updateUI();notify(c.title,4);$('pause-button').focus();},onClose:()=>{paused=progressionReturn;$('menu').hidden=!paused;$('medals-button').focus();}});
$('medals-button').addEventListener('click',()=>{progressionReturn=paused;paused=true;clearInput();$('menu').hidden=true;updateMedals(state);save();progressUI.trophies();});
function maybeProgression(){
 if(!started||storyGate||progressUI.mode||paused||map||photo||garageOpen||vehiclePicker||instructionsOpen||chaseResult||state.broken)return;
 if(state.hero.city.offers.length){progressionReturn=false;paused=true;clearInput();save();progressUI.weekly();return;}
 if(!storyFixture&&tutorialReady(state)&&!state.pursuit&&!state.trial&&Math.abs(state.speed)<40){storyGate=true;clearInput();narration.open('tutorial',[lessons[state.hero.tutorial.stage]]);}
}

const heroUI=mountHeroHud({state,renderer,toggleWork,openShop:()=>setGarage(true),chooseTarget,defend:()=>{state.hero.guideMonster=!state.hero.guideMonster;updateUI();notify(state.hero.guideMonster?'怪獣の近くまで道路矢印で案内します。':'防衛の案内を終了しました。',3);}});
const garageUI=mountGarage({state,save,notify,onPurchase:()=>{refreshVehicleStats();updateUI();maybeVehicleTalk();},chooseTarget:id=>{setGarage(false);setMenu(false);chooseTarget(id);}});
function setGarage(open){
 if(open&&!garageAt(state)){notify('ガレージに入庫して停車してください。',2);return;}
 garageOpen=open;clearInput();$('garage-panel').hidden=!open;
 if(open){lastGarageInside=garageContaining(state)?.id;garageEntryPending=false;$('toast').hidden=true;garageReturnMenu=paused;paused=true;$('menu').hidden=true;garageUI.open();$('close-garage').focus();}
 else {paused=garageReturnMenu;$('menu').hidden=!garageReturnMenu;$('pause-button').focus();}
}
let instructionsOpen=false,instructionsReturn=false;
function setInstructions(open){clearInput();instructionsOpen=open;$('instructions-panel').hidden=!open;if(open){instructionsReturn=paused;paused=true;$('menu').hidden=true;$('instructions-close').focus();}else{paused=instructionsReturn;$('menu').hidden=!instructionsReturn;(instructionsReturn?$('replay-story'):$('intro-help')).focus();}}
$('replay-story').addEventListener('click',()=>setInstructions(true));$('instructions-close').addEventListener('click',()=>setInstructions(false));
$('garage-quick').addEventListener('click',()=>setGarage(true));
$('close-garage').addEventListener('click',()=>setGarage(false));
function setVehiclePicker(open){vehiclePicker=open;clearInput();paused=open;$('vehicle-picker').hidden=!open;$('vehicle-toggle').setAttribute('aria-expanded',String(open));if(open)$('close-vehicles').focus();else $('vehicle-toggle').focus();}
$('vehicle-toggle').addEventListener('click',()=>setVehiclePicker(!vehiclePicker));$('close-vehicles').addEventListener('click',()=>setVehiclePicker(false));$('vehicle-picker').addEventListener('click',e=>{if(e.target===$('vehicle-picker'))setVehiclePicker(false);});
$('home-rest').addEventListener('click',()=>{const home=destinations.find(p=>p.id==='hero-home');if(!home||state.hero.monster||Math.hypot(state.x-home.x,state.y-home.y)>65||Math.abs(state.speed)>3)return;stopWork(state);state.hero.clock=daySeconds;updateLife(state,0);save();updateUI();});
function refreshVehicleStats(){
 const buttons=[...$('vehicles').children],rows=[...($('performance-rows')?.children??[])];
 vehicles.forEach((base,i)=>{
  const v=vehicleStats(state,i);
  if(buttons[i]){buttons[i].dataset.locked=String(!state.hero.owned[i]);buttons[i].dataset.price=String(i?machinePrice(state,i):'');}if(buttons[i])buttons[i].title=v.description+' 最高速 '+Math.round(v.max*.432)+'km/h、耐久 '+v.hp.toFixed(1);
  if(rows[i]){
   const values=[v.short,Math.round(v.max*.432)+' km/h',v.accel>=135?'速い':v.accel>=100?'標準':'ゆっくり',v.steer>=2.8?'小回り':v.steer>=2?'軽快':v.steer>=1.7?'標準':'大回り',v.hp.toFixed(1)];
   [...rows[i].children].forEach((cell,n)=>cell.textContent=values[n]);
  }
 });
}
let mapFocus=null,mapDrag=null,mapTapDragged=false;
const largeMap=$('large-map');
function paintLargeMap(){renderer.minimap(largeMap,state,target,mapFocus);}
function moveMapFocus(dx,dy){
 if(!mapFocus)return;
 mapFocus.x=Math.max(-3300,Math.min(6600,mapFocus.x+dx));
 mapFocus.y=Math.max(0,Math.min(NORTH_LIMIT*2,mapFocus.y+dy));
 paintLargeMap();
}
$('map-zoom').addEventListener('click',()=>{
 mapFocus=mapFocus?null:{x:state.x,y:state.y};
 $('map-zoom').setAttribute('aria-pressed',String(Boolean(mapFocus)));
 $('map-zoom').textContent=mapFocus?'全域に戻す':'地図を拡大';
 $('map-hint').textContent=mapFocus?'ドラッグで移動 · 北 ↑':'北 ↑';
 largeMap.classList.toggle('is-zoomed',Boolean(mapFocus));
 mapDrag=null;paintLargeMap();
});
largeMap.addEventListener('pointerdown',e=>{
 mapTapDragged=false;
 if(!mapFocus||e.button!==0||mapDrag)return;
 mapDrag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};
 largeMap.setPointerCapture(e.pointerId);
});
largeMap.addEventListener('pointermove',e=>{
 if(e.pointerId!==mapDrag?.id)return;
 if(Math.hypot(e.clientX-mapDrag.startX,e.clientY-mapDrag.startY)>6)mapTapDragged=true;
 const {scale}=mapView(largeMap.width,largeMap.height,state,{large:true,focus:mapFocus});
 const units=largeMap.width/(largeMap.getBoundingClientRect().width*scale);
 moveMapFocus((mapDrag.x-e.clientX)*units,(mapDrag.y-e.clientY)*units);
 mapDrag.x=e.clientX;mapDrag.y=e.clientY;
});
for(const type of ['pointercancel','pointerup','lostpointercapture'])largeMap.addEventListener(type,e=>{
 if(e.pointerId===mapDrag?.id)mapDrag=null;
});
largeMap.addEventListener('click',e=>{
 if(mapTapDragged){mapTapDragged=false;return;}
 const rect=largeMap.getBoundingClientRect(),ratio=largeMap.width/rect.width,{at}=mapView(largeMap.width,largeMap.height,state,{large:true,focus:mapFocus});
 const x=(e.clientX-rect.left)*ratio,y=(e.clientY-rect.top)*ratio;
 const entry=railAccessPoints.map(p=>({p,d:Math.hypot(at(p.x,p.y)[0]-x,at(p.x,p.y)[1]-y)})).filter(v=>v.d<22*ratio).sort((a,b)=>a.d-b.d)[0]?.p;
 if(entry)chooseTarget(entry.id);
});
largeMap.addEventListener('keydown',e=>{
 const vectors={ArrowUp:[0,-220],ArrowDown:[0,220],ArrowLeft:[-220,0],ArrowRight:[220,0]};
 if(!mapFocus||!vectors[e.key])return;
 e.preventDefault();moveMapFocus(...vectors[e.key]);
});
function setMap(open){map=open;clearInput();$('map-panel').hidden=!open;if(open){refreshJobOffers();lastFocus=document.activeElement;$('toast').hidden=true;paintLargeMap();for(const b of $('spot-buttons').children)b.setAttribute('aria-pressed',String(b.dataset.id===target));$('close-map').focus();}else lastFocus?.focus();}

function chooseVehicle(index){if(state.hero.owned[index]===false){notify('ショップで '+vehicles[index].name+' を購入できます。');return;}if(state.pursuit){notify('追跡中は乗り換えできません。中止すると自由走行に戻れます。');return;}if(!switchVehicle(state,index)){notify('もう少し広い道で、乗り換えてください。');return;}if(state.work&&state.work.vehicle!==index)stopWork(state);syncChallengeControls();updateUI();save();notify(vehicles[index].name+' — '+vehicles[index].description,2.5);}
function recover(){
 if(state.pursuit){notify('追跡中は復帰できません。メニューから中止できます。');return;}
 clearInput();
 const broken=state.broken;
 const point=rescue(state,$('recovery-site').value);
 syncMusic();renderer.camera.x=state.x;renderer.camera.y=state.y;renderer.camera.z=groundHeight(state.x,state.y);
 updateUI();save();
 notify(broken?point.name+'で修理しました。':'走れる道へ戻りました。');
}
function setTrial(active){
 state.trial=active?beginParkTrial():null;
 syncChallengeControls();
 $('trial-record').textContent=trialBest===null?'自己ベスト未計測':'自己ベスト '+trialBest.toFixed(2)+' 秒';
 updateUI();
}
function syncChallengeControls(){
 const active=Boolean(state.trial||state.pursuit||state.work||state.serviceGuide);
 $('cancel-trial').textContent=state.serviceGuide?'案内を終了':'中止';
 $('cancel-trial').hidden=!active;$('next-destination').hidden=active;
 $('start-trial').textContent=state.trial?'最初から挑戦する':'挑戦する';
 $('start-pursuit').textContent=state.pursuit?'追跡をやり直す':'追跡に挑戦';
}
function endPursuit(){
 state.pursuit=null;
 syncChallengeControls();
 updateUI();
}
function chooseTarget(id){const p=destinations.find(p=>p.id===id);if(!p)return;target=id;state.serviceGuide=!state.trial&&!state.pursuit&&(p.service||p.railEntry||p.railExit||p.heroFacility||p.id==='garage')?id:null;syncChallengeControls();updateUI();setMap(false);notify(p.name+'へ。'+(guidanceTarget(state,target)?.serviceRoute?p.railExit?(state.surface==='rail'&&state.deck>4?'金色の線路矢印で降り口へ案内します。':'地上側の合流地点へ案内します。'):'水色の道路矢印で案内します。':'道中も、楽しんで。'),2.5);}
function nextTarget(){const i=destinations.findIndex(p=>p.id===target);chooseTarget(destinations[(i+1)%destinations.length].id);}
function updateUI(){
 $('medals-button').textContent='勲章 '+state.hero.career.medals.length+' / '+medals.length;const c=state.hero.city;$('city-summary').textContent='街づくり '+c.history.length+'回 ／ 交通量 '+Math.round(c.traffic*100)+'% ／ 建物 '+(c.buildings>=0?'+':'')+c.buildings+' ／ 緑 '+(c.nature>=0?'+':'')+c.nature+'\n建物強度 ×'+c.buildingArmor.toFixed(2)+' ／ 市民の復活 '+c.resilience+'回 ／ 報酬 ×'+c.reward.toFixed(2)+'\n自然強度 ×'+c.natureArmor.toFixed(2)+' ／ 再建 ×'+c.rebuild.toFixed(2)+' ／ 災害間隔 ×'+c.disaster.toFixed(2)+(state.hero.day<c.seasonUntil?' ／ '+({rainy:'梅雨',winter:'冬',spring:'春'}[c.season]??'平常')+'（'+c.seasonUntil+'日目まで）':'');

 $('game').classList.toggle('is-playing',started);
 heroUI.update({visible:started&&!photo&&!map&&!paused});
 const clock=(6+state.hero.clock/daySeconds*24)%24;renderer.mode=clock>=18||clock<6?'night':clock>=15?'golden':'day';$('time-button').textContent=$('hero-day').textContent;
 const railGrade=state.surface==='rail'?railSurface(state.x,state.y):null;
 const slope=roadGrade(state.x,state.y,state.heading)+(railGrade?railGrade.grade*Math.cos(state.heading-railGrade.angle):0);
 $('altitude').textContent='標高 '+((groundHeight(state.x,state.y)+(state.deck??0))*.12).toFixed(1)+'m　'+(state.surface==='rail'?'線路上　':'')+(Math.abs(slope)>.02?(slope>0?'上り ':'下り ')+Math.abs(slope*100).toFixed(0)+'%':'平坦');
 $('speed').textContent=Math.round(Math.abs(state.speed)*.432);$('trip').textContent=(state.distance*.00012).toFixed(2);$('stamp-count').textContent=state.collected.size+' / '+spots.length;
 let place='こもれび町';if(state.y>3100&&state.x<1700)place='南のこなら林';else if(state.y>2400&&state.x<1700)place='風紡ぎ広場';else if(state.y>1650&&state.x<1750)place='灯葉の森';else if(state.y>1550&&state.y<2350&&state.x>1600)place='鏡羽池';else if(state.y<1000&&state.x>1850&&state.x<2500)place='こだま横丁';else if(state.y>1250&&state.y<1550)place='木漏れ日駅前';else if(state.x>2400&&state.y>2300)place='東の住宅街';const landmark=destinations.slice(10).find(p=>Math.hypot(p.x-state.x,p.y-state.y)<(p.service?48:225));
 $('current-place').textContent=landmark?.name??(state.y>=NORTH_LIMIT?(state.x<400?'杏灯の市':state.x<3750?'白波水門周辺':'花帆の丘'):state.x<0?'西の街':state.x>3300?'東の街':place);
 const v=vehicleStats(state),hp=Math.max(0,state.health[state.vehicle]),ratio=hp/v.hp;
 const shownHp=Math.min(v.hp,Math.ceil(hp*10)/10);
 const healthValue=shownHp+' / '+v.hp;
 const percentage=Math.ceil(ratio*100)+'%';
 $('health-value').textContent=healthValue;
 $('health-percent').textContent=percentage;
 $('health-bar').setAttribute('aria-valuemax',v.hp);
 $('health-bar').setAttribute('aria-valuenow',shownHp);
 $('health-bar').setAttribute('aria-valuetext',percentage+'、'+healthValue);
 $('health-bar').parentElement.dataset.low=String(ratio<=.25);
 $('health-fill').style.transform='scaleX('+ratio+')';
 $('stunt-status').textContent=state.broken?'走行不能':state.repairSite&&ratio<1?'整備中':state.z>1?'ジャンプ中':state.boost>0?'ダッシュ '+state.boost.toFixed(1)+'s':state.pursuit?'追跡中':state.work?'仕事中':'';
 $('destruction-count').textContent=destroyedCount(state);
 const pedestrianCount=String(state.pedestrianHits);
 if($('pedestrian-count').textContent!==pedestrianCount)$('pedestrian-count').textContent=pedestrianCount;
 const showBreakdown=started&&!photo&&!chaseResult&&state.broken&&state.time-(state.breakdownAt??-Infinity)>=WRECK_DURATION;
 const newBreakdown=showBreakdown&&$('breakdown').hidden;
 $('breakdown').hidden=!showBreakdown;
 if(newBreakdown){
  $('breakdown-health').textContent=percentage+'（'+healthValue+'）';
  $('recovery-site').replaceChildren(...recoverySites(state).map((p,i)=>new Option(p.name+(i===0?'（最寄り）':''),p.id)));
  syncMusic();clearInput();$('repair-button').focus();
 }
 const last=state.lastHit&&world.byId.get(state.lastHit.id);$('object-condition').hidden=!last||state.time-state.lastHit.time>4;if(last){const type={wood:'木造',brick:'レンガ',concrete:'コンクリート',metal:'金属'}[last.material]??'';$('object-condition').textContent=type+(last.kind==='building'||last.kind==='station'?'の建物':'のオブジェクト')+'　耐久 '+Math.ceil(Math.max(0,last.hp-(state.damage[last.id]??0)))+' / '+last.hp;}

 $('garage-quick').hidden=!garageAt(state)||paused||storyGate;const home=destinations.find(p=>p.id==='hero-home');$('home-rest').hidden=!home||Math.hypot(state.x-home.x,state.y-home.y)>65||Boolean(state.hero.monster);$('population-live').textContent='人口 '+population(state).toLocaleString('ja-JP')+'人';
 const receipt=state.workReceipt&&state.time-state.workReceipt.at<5.5?state.workReceipt:null,effect=receipt??state.jobEffect,showEffect=effect&&state.time-effect.at<(receipt?5.5:jobFeedbackSeconds)&&state.time>=effect.at&&!photo&&started;
 $('job-feedback').hidden=!showEffect;$('job-feedback').classList.toggle('job-complete',Boolean(receipt));
 if(showEffect){for(const [id,text] of [['job-feedback-title',effect.label],['job-feedback-detail',effect.detail],['job-feedback-reward',effect.reward?'＋'+effect.reward+' pt':'']])if($(id).textContent!==text)$(id).textContent=text;}
 $('points').textContent=state.points+' pt';
 $('map-level').textContent=state.surface==='rail'&&state.deck>4?'現在地：高架上':'現在地：地上';
 $('destination').hidden=!started||photo||Boolean(state.hero.monster)||!(state.work||state.serviceGuide||state.trial||state.pursuit);
 const workGoal=jobTarget(state);
 const gate=workGoal??parkGates[state.trial?.gate];
 const p=gate??destinations.find(p=>p.id===target);
 $('start-trial').disabled=$('start-pursuit').disabled=Boolean(state.broken);
 const pursuit=state.pursuit;
 const serviceGoal=state.serviceGuide&&guidanceTarget(state,target);
 if(state.hero.monster&&state.hero.guideMonster){$('destination-name').textContent='防衛指令　怪獣の現場へ';$('destination-distance').textContent=Math.round(Math.hypot(state.x-state.hero.monster.x,state.y-state.hero.monster.y)*.12)+' m';
 }else if(serviceGoal){
  $('destination-name').textContent=(serviceGoal.railExit?'降り口へ　':serviceGoal.railEntry?'高架へ　':'ガレージへ　')+serviceGoal.name;
  $('destination-distance').textContent=Math.round(Math.hypot(state.x-serviceGoal.x,state.y-serviceGoal.y)*.12)+' m';
 }else if(state.work){
  $('destination-name').textContent=state.work.name+' '+(state.work.index+1)+' / '+state.work.stops.length+(state.work.timeLimit?'　残り '+Math.ceil(Math.max(0,state.work.timeLimit-state.work.elapsed))+'秒':'');
  $('destination-distance').textContent=state.vehicle!==state.work.vehicle?'指定車両に乗り換え':workGoal.name+'　'+(state.work.hold>0?servicePhase(state.work)+' '+state.work.hold.toFixed(1)+' / '+(state.work.serviceDuration??1.5)+'秒':Math.round(Math.hypot(state.x-workGoal.x,state.y-workGoal.y)*.12)+' m');
 }else if(pursuit){
  $('destination-name').textContent='遠距離エスケープ　'+(pursuit.started?'残り '+Math.ceil(pursuit.remaining)+' 秒':'前進すると開始');
  $('destination-distance').textContent=pursuitGoal.name+'　'+Math.round(Math.hypot(state.x-pursuitGoal.x,state.y-pursuitGoal.y)*.12)+' m';
 }else if(gate){
  const elapsed=state.trial.startedAt===null?'':(state.time-state.trial.startedAt).toFixed(1)+' 秒';
  $('destination-name').textContent='公園タイムアタック　'+gate.name;
  $('destination-distance').textContent=elapsed||Math.round(Math.hypot(state.x-gate.x,state.y-gate.y)*.12)+' m';
 }else{
  $('destination-name').textContent=(state.collected.has(p.id)?'もう一度、':'次の寄り道　')+p.name;
  $('destination-distance').textContent=Math.round(Math.hypot(state.x-p.x,state.y-p.y)*.12)+' m';
 }
 [...$('vehicles').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===state.vehicle)));renderer.minimap($('minimap'),state,target);
}
function input(){if(qaInput)return qaInput;return {throttle:(keys.has('w')||keys.has('arrowup')||touch.has('go')?1:0)-(keys.has('s')||keys.has('arrowdown')||touch.has('reverse')?1:0),steer:(keys.has('d')||keys.has('arrowright')||touch.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||touch.has('left')?1:0),brake:keys.has(' ') };}
function update(dt){
 if(!started||paused||photo||map||chaseResult||document.hidden||qaFreeze||storyGate||(state.broken&&!$('breakdown').hidden)){audio?.pause();return;}
 if(state.hero.monster&&state.hero.monster.phase!=='retreating'&&state.hero.monster!==announcedMonster&&!storyFixture){showRaidWarning();return;}
 // Traffic uses a 30 Hz step independently of the player's 120 Hz physics.
 trafficElapsed+=dt;
 if(trafficElapsed>=1/30){
  if(state.pursuit){
   const outcome=updatePursuit(state.pursuit,state,trafficElapsed);
   if(outcome==='started')notify('追跡開始。4分以内に花帆駅南のゴールへ。',3);
   else if(outcome)showChaseResult(outcome);
  }
  updateAmbulances(state,state.traffic,trafficElapsed);
  updatePedestrians(state.crowd,state.traffic,state,state.time,trafficElapsed);
  updateTraffic(state.traffic,state,state.time,trafficElapsed,state.crowd.crossings,car=>collideWithTraffic(state,car));
  if(audio){
   let siren=Infinity;
   for(const patrol of state.pursuit?.cars??[])if(patrol.active&&patrol.health>0)siren=Math.min(siren,Math.hypot(state.x-patrol.x,state.y-patrol.y));
   for(const car of state.responses)if(car.phase!=='loading'&&ambulanceVisible(car,state.time))siren=Math.min(siren,Math.hypot(state.x-car.x,state.y-car.y));
   if([7,8].includes(state.vehicle)&&state.work&&!state.broken)siren=0;audio.emergency(siren,state.time);
  }
  if(audio)for(const car of state.traffic){
   if(car.health!==0||heardWrecks.get(car)===car.wreckedAt)continue;
   heardWrecks.set(car,car.wreckedAt);
   const distance=Math.hypot(state.x-car.x,state.y-car.y);
   if(distance<360)audio.impact(true,Math.max(.08,1-distance/360));
  }
  trafficElapsed=0;
 }
 driver?.(dt);const controls=input(),eventStart=state.events.length,previous=[state.x,state.y],r=step(state,controls,dt);audio?.drive(state,controls);
 for(const e of state.events.slice(eventStart)){
  if(e.type==='breakdown')audio?.impact(true);
  if(e.type==='traffic-hit')audio?.impact(false);
  if(e.type==='pedestrian-hit'){audio?.impact(false,.35);save();const victim=state.struck.get(e.id),dispatched=!victim?.survived&&dispatchAmbulance(state,victim);notify(victim?.survived?'市民は立ち上がれそうです':dispatched?'救急車が向かっています':'歩行者に接触',2.2);}
  if(e.type==='boost')notify('ダッシュ！ 速度が上がっています。',1.5);else if(e.type==='jump')notify('ジャンプ！',1.1);else if(e.type==='object-break')notify('オブジェクトを破壊しました。',1.5);else if(e.type==='train-hit')notify('電車に衝突。耐久が減っています。',3);else if(e.type==='water-rescue')notify('水辺から道へ戻りました。',3);}
 const railExit=exitedRailGuide(state);if(railExit){target='station';syncChallengeControls();notify(railExit.name+'から地上へ。'+(state.work?'仕事の案内に戻りました。':'自由走行を続けられます。'),4);}
 const railEntry=enteredRailGuide(state);if(railEntry){target='station';syncChallengeControls();notify(railEntry.name+'に進入。光る矢印に沿って上がれます。'+(state.work?'仕事の案内に戻りました。':''),4);}
 if(state.serviceGuide&&garageAt(state)?.id===state.serviceGuide){state.serviceGuide=null;syncChallengeControls();notify(state.work?'ガレージに到着。仕事の案内へ戻ります。':'ガレージに到着しました。',3);}
 const inside=garageContaining(state)?.id;if(inside!==lastGarageInside){garageEntryPending=Boolean(inside);lastGarageInside=inside;}if(garageEntryPending&&garageAt(state)){garageEntryPending=false;setGarage(true);return;}
 updateLife(state,dt);if(state.hero.city.offers.length){maybeProgression();return;}updateWeatherHazards(state,dt);state.attackPulse=Math.max(0,(state.attackPulse??0)-dt);updateCombat(state,dt,controls.attack||keys.has('x')||touch.has('attack')||state.attackPulse>0);
 if(state.attackBeam)audio?.weapon(state.attackBeam.kind);if(state.lastCannonAt!==state.heardCannonAt){state.heardCannonAt=state.lastCannonAt;if(Number.isFinite(state.lastCannonAt))audio?.impact(true,.6);}
 if(state.lastMonsterAttack&&state.heardMonsterAttack!==state.lastMonsterAttack){state.heardMonsterAttack=state.lastMonsterAttack;const kind=state.lastMonsterAttack.kind;if(kind==='beam')audio?.weapon('robot-rifle');else if(kind==='slash')audio?.weapon('beam-sword');else audio?.impact(true,kind==='meteor-cast'?.35:.85);}
 if(state.heroNotice){notify(state.heroNotice,6);delete state.heroNotice;save();}
 medalTick+=dt;if(medalTick>=.5){medalTick=0;const got=updateMedals(state);if(got.length){notify('勲章獲得：'+got[0].name+(got.length>1?' ほか'+(got.length-1)+'個':''),5);save();}}
 const workResult=updateJob(state,dt);
 if(workResult){syncChallengeControls();save();if(workResult.type==='failed')notify(workResult.reason??'仕事終了。修理して再挑戦できます。',4);else $('toast').hidden=true;}
 if(state.trial){
  const result=updateParkTrial(state.trial,state,previous);
  if(result?.type==='started')notify('計測開始。光る目印を順に通過しよう。',2.5);
  if(result?.type==='finished'){
   state.hero.career.races++;save();const best=trialBest===null||result.seconds<trialBest;
   if(best){trialBest=result.seconds;try{localStorage.setItem(trialKey,String(trialBest));}catch{}}
   setTrial(false);notify('ゴール　'+result.seconds.toFixed(2)+' 秒'+(best?'　自己ベスト更新':''),5);
  }
  if(result?.type==='failed'){setTrial(false);notify('計測終了。修理したらまた挑戦できます。',3);}
 }
 if(r.hit&&Math.abs(state.speed)>40&&performance.now()>toastUntil)notify('狭い道はゆっくり。Rで道へ戻れます。',2.5);
 for(const p of spots)if(!state.collected.has(p.id)&&Math.hypot(state.x-p.x,state.y-p.y)<48){state.collected.add(p.id);notify(p.name+'　'+p.caption,5);if(target===p.id)target=spots.find(x=>!state.collected.has(x.id))?.id??'pond';save();if(state.collected.size===spots.length)notify('街のかけら、全部。まだ知らない道へ出かけよう。',7);}
 saveTick+=dt;if(saveTick>4){saveTick=0;save();}
}
function frame(now){
 maybeProgression();maybeVehicleTalk();
 if(music&&music.scene!==musicScene())syncMusic();
 const rawElapsed=(now-last)/1000,elapsed=Math.min(rawElapsed,.10);last=now;accumulator+=elapsed;
 const simulationStarted=performance.now();
 while(accumulator>=1/120){update(1/120);accumulator-=1/120;}
 const simulationMs=performance.now()-simulationStarted;if(qa&&metrics.simulationMs.length<3600)metrics.simulationMs.push(simulationMs);
 updateChaseCompass();workCompass.update(state,renderer,started&&!paused&&!map&&!photo&&!storyGate&&!chaseResult);
 const drawStarted=performance.now();renderer.draw(state,elapsed,{paused:paused||map||photo||chaseResult||!started||qaFreeze||storyGate||(state.broken&&!$('breakdown').hidden),photo,target});if(started&&metrics.drawMs.length<3600)metrics.drawMs.push(performance.now()-drawStarted);
 const drawMs=performance.now()-drawStarted,uiStarted=performance.now();
 uiTick+=elapsed;if(uiTick>.10){uiTick=0;updateUI();}
 const uiMs=performance.now()-uiStarted;if(qa&&metrics.uiMs.length<3600)metrics.uiMs.push(uiMs);if(qa&&started&&!paused&&(drawMs+simulationMs+uiMs>25)&&metrics.spikes.length<150)metrics.spikes.push({t:state.time,draw:drawMs,simulation:simulationMs,ui:uiMs,tiles:renderer.tileMetrics?.slice(-2)});
 metrics.frames++;metrics.elapsed+=elapsed;if(metrics.frameMs.length<3600&&started&&!paused&&!document.hidden){metrics.frameMs.push(rawElapsed*1000);if(qa&&rawElapsed>.033&&metrics.frameGaps.length<150)metrics.frameGaps.push({t:state.time,ms:rawElapsed*1000});}
 if(!$('toast').hidden&&now>toastUntil)$('toast').hidden=true;
 requestAnimationFrame(frame);
}
const jobOffers=new Map(),jobRows=new Map();
function refreshJobOffers(){
 for(const spec of jobTypes){
  const job=availableJob(state,spec.id);jobOffers.set(spec.id,job);
  const {button,detail}=jobRows.get(spec.id);
  button.textContent=spec.name+'　'+(job?.reward??spec.reward)+' pt';button.disabled=!job;
  detail.textContent=job&&['fire','ambulance'].includes(spec.id)?(spec.id==='fire'?'現場で5秒停車して放水':'現場で収容し、病院で降車')+' ／ '+job.plannedMetres+' m ／ 自動連続勤務':!job?'受注できる対象がありません':job.plannedMetres?
   (spec.id==='demolition'?job.stops[0].name+'　面積 '+job.demolition.area+' m²・高さ '+job.demolition.height+' m・残耐久 '+job.demolition.remainingHp+' / '+job.demolition.maximumHp+'・強度 ×'+job.demolition.strength+'（規模と残る解体作業で報酬確定）':
   (spec.id==='taxi'?'乗車：'+job.stops[0].name+' ／ 送迎：'+job.stops[1].name:(spec.id==='bus'?job.routeLabel+'　':'')+job.stops.length+(spec.id==='bus'?'停留所を巡回：':'件配達：')+job.stops.map(p=>p.name).join('、'))+'　予定 '+job.plannedMetres+' m（受注時からの道路距離・報酬確定）'):'目印の建物を解体';
 }
}
for(const spec of jobTypes){
 const row=document.createElement('div'),button=document.createElement('button'),detail=document.createElement('p');button.type='button';
 detail.id='job-offer-'+spec.id;button.setAttribute('aria-describedby',detail.id);row.className='job-offer';row.append(button,detail);jobRows.set(spec.id,{button,detail});
 button.addEventListener('click',()=>{
  if(state.broken){notify('修理してから仕事を受けてください。');return;}
  const job=jobOffers.get(spec.id);
  if(!job){notify('受注できる対象がありません。');return;}
  if(!switchVehicle(state,spec.vehicle)){notify('広い道で指定車両に乗り換えられる場所へ移動してください。');return;}
  state.jobEffect=null;state.pursuit=null;if(!startWork(state,spec.id,job)){notify('この車両を購入してから仕事を始めてください。');return;}save();setTrial(false);
  setMenu(false);if(!started)start();
  notify('勤務開始',1.5);
 });
 $('job-buttons').append(row);
}
refreshJobOffers();
function toggleWork(){
 if(storyGate)return;
 if(state.work){stopWork(state);syncChallengeControls();save();updateUI();notify('勤務終了',1.5);return;}
 if(state.trial||state.pursuit||state.broken)return;let spec=jobTypes.find(j=>j.vehicle===state.vehicle);if(!spec){spec=jobTypes.find(j=>state.hero.owned[j.vehicle]);if(!spec||!switchVehicle(state,spec.vehicle))return;refreshVehicleStats();}
 if(startWork(state,spec.id)){state.jobEffect=null;syncChallengeControls();save();updateUI();notify('勤務開始',1.5);}else notify('仕事を受注できません。');
}
$('start-trial').addEventListener('click',()=>{
 if(!moveToChallengeStart(state,parkGates[0],0)){notify('スタート周辺の安全な場所が空くまで少し待ってください。');return;}
 setMenu(false);if(!started)start();state.serviceGuide=null;state.work=null;state.pursuit=null;setTrial(true);
 renderer.camera.x=state.x;renderer.camera.y=state.y;save();notify('スタート地点へ移動しました。前進して目印を通ると計測開始。',4);
});
function startChase(){
 if(!moveToChallengeStart(state,escapeStart,Math.atan2(260,-750))){notify('スタート周辺の安全な場所が空くまで少し待ってください。');return;}
 chaseResult=null;$('pursuit-result').hidden=true;
 renderer.camera.x=state.x;renderer.camera.y=state.y;
 setMenu(false);if(!started)start();
 state.serviceGuide=null;state.work=null;state.pursuit=beginPursuit();setTrial(false);
 if(qa)delete $('game').dataset.pursuitResult;
 save();notify('西のスタート地点へ移動。前進で開始、4分以内に遠方のゴールへ。',5);
}
function showChaseResult(outcome){
 const elapsed=state.pursuit?.elapsed??0;
 if(qa)$('game').dataset.pursuitResult=outcome;
 if(outcome==='escaped')state.hero.career.escapes++;chaseResult={outcome,elapsed};endPursuit();clearInput();save();
 $('pursuit-result-title').textContent=outcome==='escaped'?'ゴール！':'ゲームオーバー';
 $('pursuit-result-detail').textContent=outcome==='escaped'?'花帆駅南へ到着。'+elapsed.toFixed(1)+'秒で逃走成功。':outcome==='timeout'?'制限時間が終了しました。':'車両が大破しました。';
 $('pursuit-result').hidden=false;$('chase-retry').focus();
}
function updateChaseCompass(){
 const active=Boolean(started&&state.pursuit&&!photo);$('chase-compass').hidden=!active;$('game').classList.toggle('pursuit-active',active);
 if(!active)return;
 const goal=renderer.screen(pursuitGoal.x,pursuitGoal.y),player=renderer.screen(state.x,state.y,state.deck??0);
 const angle=Math.atan2(goal.y-player.y,goal.x-player.x)+Math.PI/2;
 $('chase-arrow').style.transform='rotate('+angle+'rad)';
 $('chase-time').textContent=state.pursuit.started?'残り '+Math.ceil(state.pursuit.remaining)+' 秒':'前進でスタート';
 $('chase-compass').setAttribute('aria-label','ゴール方向、'+Math.round(Math.hypot(state.x-pursuitGoal.x,state.y-pursuitGoal.y)*.12)+'メートル、'+$('chase-time').textContent);
}
$('start-pursuit').addEventListener('click',startChase);
$('chase-retry').addEventListener('click',()=>{if(state.broken)repair(state);startChase();});
$('chase-free').addEventListener('click',()=>{chaseResult=null;$('pursuit-result').hidden=true;if(state.broken)rescue(state);clearInput();save();updateUI();$('pause-button').focus();});
$('cancel-trial').addEventListener('click',()=>{if(state.serviceGuide){state.serviceGuide=null;target=spots.find(p=>!state.collected.has(p.id))?.id??'station';syncChallengeControls();updateUI();notify(state.work?'仕事の案内に戻りました。':'案内を終了しました。',2);return;}stopWork(state);if(state.pursuit)endPursuit();else setTrial(false);$('next-destination').focus();notify('自由走行に戻りました。',2);});
$('intro-help').addEventListener('click',()=>setInstructions(true));$('pause-button').addEventListener('click',()=>setMenu(true));$('close-menu').addEventListener('click',()=>setMenu(false));$('resume-button').addEventListener('click',()=>setMenu(false));$('return-title').addEventListener('click',returnTitle);$('map-button').addEventListener('click',()=>setMap(true));$('close-map').addEventListener('click',()=>setMap(false));$('next-destination').addEventListener('click',nextTarget);
$('time-button').addEventListener('click',()=>setMenu(true));
function toggleRobotWeapon(){if(state.vehicle!==10||storyGate||paused||map)return;state.hero.robot.weapon=state.hero.robot.weapon==='rifle'?'sword':'rifle';state.weaponCooldown=0;state.weaponTraceRevision=(state.weaponTraceRevision??0)+1;save();updateUI();}
$('robot-weapon').addEventListener('click',toggleRobotWeapon);
$('hero-attack').addEventListener('click',e=>{if(e.detail===0)state.attackPulse=.18;});
$('title-music').addEventListener('click',toggleMusic);
$('bgm-button').addEventListener('click',toggleMusic);
$('audio-button').textContent=driveSoundEnabled?'走行音をオフにする':'走行音をオンにする';
$('audio-button').addEventListener('click',()=>{
 driveSoundEnabled=!driveSoundEnabled;
 try{localStorage.setItem(qa?'komorebi-drive-audio-test':'komorebi-drive-audio',driveSoundEnabled?'on':'off');}catch{}
 $('audio-button').textContent=driveSoundEnabled?'走行音をオフにする':'走行音をオンにする';
 if(driveSoundEnabled)void enableDriveSound();
 else if(audio){const current=audio;audio=null;current.pause();void current.context.close().catch(()=>{});}
});
$('repair-button').addEventListener('click',recover);$('rebuild-button').addEventListener('click',()=>{rebuildTown(state);updateUI();save();notify('建物と小物を元に戻しました。');});

window.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target.isContentEditable)return;
 const k=e.key.toLowerCase();
 if(k==='escape')return;
 if(progressUI.mode)return;
 if(storyGate)return;
 if(e.target instanceof HTMLSelectElement){
  if(e.target.id==='recovery-site'&&k==='r'&&!e.repeat){e.preventDefault();recover();}
  return;
 }
 if(chaseResult)return;

 if(!started||paused||map||photo){if(!e.repeat&&k==='m'&&map)setMap(false);return;}
 if(k===' '&&(e.target.closest('button, a, summary')||state.broken))return;
 if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(e.repeat)return;
 keys.add(k);if(k==='c')toggleRobotWeapon();if(/^[1-9]$/.test(k))chooseVehicle(Number(k)-1);if(k==='j')toggleWork();if(k==='g')setGarage(true);if(k==='h')chooseTarget('hero-home');if(k==='e'){for(let n=1;n<=vehicles.length;n++){const index=(state.vehicle+n)%vehicles.length;if(state.hero.owned[index]){chooseVehicle(index);break;}}};if(k==='r')recover();if(k==='m')setMap(true);if(k==='='||k==='+')renderer.targetZoom=Math.min(1.5,renderer.targetZoom+.15);if(k==='-')renderer.targetZoom=Math.max(.65,renderer.targetZoom-.15);
});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearInput();save();});window.addEventListener('pagehide',()=>{clearInput();save();});window.addEventListener('contextmenu',event=>{if(!event.defaultPrevented)clearInput();});document.addEventListener('visibilitychange',()=>{clearInput();syncMusic();last=performance.now();if(document.hidden)save();});window.addEventListener('resize',()=>{renderer.resize();if(map)paintLargeMap();});
// Keyboard focus stays inside an open overlay; driving input is cleared on every transition.
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||storyGate)return;const panel=progressUI.panel??(instructionsOpen?$('instructions-panel'):vehiclePicker?$('vehicle-picker'):chaseResult?$('pursuit-result'):garageOpen?$('garage-panel'):!$('menu').hidden?$('menu'):!$('map-panel').hidden?$('map-panel'):!$('breakdown').hidden?$('breakdown'):null);if(!panel)return;const nodes=[...panel.querySelectorAll('button,a,select,summary,canvas[tabindex]')].filter(el=>el.offsetParent!==null);const first=nodes[0],end=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}});
async function boot(){try{
 await loadPixelVfx();await renderer.init(p=>{$('load-progress').value=.2+p*.8;$('load-note').textContent='木々と店先を描画中';});metrics.assetReady=true;setTrial(false);metrics.bootMs=performance.now()-bootStarted;
 vehicles.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',v.name+'に乗り換える');b.title=v.description+' 最高速 '+Math.round(v.max*.432)+'km/h、耐久 '+v.hp;b.setAttribute('aria-pressed',String(i===state.vehicle));const im=new Image();im.src=renderer.vehicleIcon(i);im.alt='';const key=document.createElement('span');key.className='vehicle-key';key.textContent=i+1;const label=document.createElement('span');label.className='vehicle-label';label.textContent=v.short;b.append(key,im,label);b.addEventListener('click',()=>{chooseVehicle(i);if(instructionsOpen)setInstructions(false);else if(vehiclePicker)setVehiclePicker(false);else if(started&&paused)setMenu(false);});$('vehicles').append(b);const row=document.createElement('tr');for(const text of [v.short,Math.round(v.max*.432)+' km/h',v.accel>=135?'速い':v.accel>=100?'標準':'ゆっくり',v.steer>=2.8?'小回り':v.steer>=2?'軽快':v.steer>=1.7?'標準':'大回り',v.hp]){const td=document.createElement('td');td.textContent=text;row.append(td);}$('performance-rows')?.append(row);});
 refreshVehicleStats();
 destinations.map((p,index)=>({p,index})).sort((a,b)=>Number(Boolean(b.p.garage))-Number(Boolean(a.p.garage))).forEach(({p,index})=>{const b=document.createElement('button');b.textContent=(p.garage?'G　':(index+1)+'　')+p.name;if(p.garage)b.className='garage-destination';b.dataset.id=p.id;b.addEventListener('click',()=>chooseTarget(p.id));$('spot-buttons').append(b);});

 $('loading').hidden=true;front.ready();updateUI();requestAnimationFrame(frame);
 }catch(e){metrics.errors.push(String(e));$('load-note').textContent='街を読み込めませんでした。再読み込みしてください。';$('loading').querySelector('p').textContent=String(e.message);}}
boot();
