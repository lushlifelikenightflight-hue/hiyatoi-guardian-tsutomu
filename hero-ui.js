import {repairCost} from './balance-tuning.js?v=5.3.0';
import {robotParts,occupancy,updateRobotProgress} from './robot-progress.js?v=5.3.0';
import {robotWeapons} from './robot-specs.js?v=5.3.0';
import {machinePrice,weaponUpgradeCost} from './economy.js?v=5.3.0';
import {weatherHandling} from './weather.js?v=5.3.0';
import {daySeconds,population,weaponSpecs,machinePrices,shopPurchase,shopAt,updateLife} from './hero-life.js?v=5.3.0';
import {activeWeapon} from './hero-combat.js?v=5.3.0';
import {vehicles} from './vehicle-specs.js?v=5.3.0';
import {jobTypes,stopWork} from './jobs.js?v=5.3.0';
const $=id=>document.getElementById(id);
export function mountHeroHud({state,renderer,toggleWork,openShop,chooseTarget,defend}){
 $('work-quick').addEventListener('click',toggleWork);
 $('hero-shop-open')?.addEventListener('click',openShop);
 $('hero-home-route').addEventListener('click',()=>chooseTarget('hero-home'));
 $('hero-defend').addEventListener('click',defend);
 for(const id of ['work-quick','hero-shop-open','hero-home-route','hero-defend'])$(id)?.addEventListener('keydown',e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();});
 return {update({visible=true}={}){
  const h=state.hero,time=(6+h.clock/daySeconds*24)%24,hour=Math.floor(time),minute=Math.floor(time%1*60),left=Math.ceil(daySeconds-h.clock),w=activeWeapon(state),job=jobTypes.find(j=>j.vehicle===state.vehicle);
  $('hero-day').textContent=h.day+'日目　'+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
  $('hero-weather').textContent=weatherHandling(state).name;$('hero-weather').title=weatherHandling(state).road;
  $('hero-population').textContent='街の人口 '+population(state).toLocaleString('ja-JP')+'人';
  $('hero-tax').textContent=(h.lastTax?'前回の税収 ＋'+h.lastTax.amount.toLocaleString('ja-JP')+' pt / ':'')+'次の税収 '+((h.lastTaxWeek+1)*7+1)+'日目（人口×1 pt）';
  $('hero-defend').textContent=h.guideMonster?'防衛案内を終了':'防衛地点へ案内';
  $('hero-countdown').textContent=h.monster?(h.monster.phase==='retreating'?'怪獣撤退中 / 無敵':h.monster.phase==='approaching'?'怪獣接近中！':'怪獣襲来中！'):(h.raidVisits===0&&h.tutorial.stage<5?'防衛準備中 / 本日残り ':h.nextRaid+'日目に襲来 / 本日残り ')+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
  $('work-quick').hidden=false;
  $('work-quick').disabled=state.broken||Boolean(state.trial||state.pursuit)||!h.owned[state.vehicle];
  $('work-quick').textContent=state.work?'仕事をやめる':'仕事を始める';
  $('hero-rank').textContent=h.lastRank?'前回 '+h.lastRank.rank+' / '+h.lastRank.seconds+'秒 / '+h.lastRank.damage+'ダメージ':'仕事を続けて、武装を揃えよう';
  $('hero-weapon').textContent=w?w.name+(state.vehicle===10||w.id==='cannon'?' 標準装備':' Lv.'+h.weaponLevels[weaponSpecs.findIndex(p=>p.id===w.id)]):'武器未装備';
  $('robot-weapon').hidden=state.vehicle!==10;$('robot-weapon').textContent=(h.robot?.weapon==='sword'?'ビームソード':'ライフル')+' C';
  $('hero-occupation').textContent='マップ占有率 '+occupancy(h.robot).toFixed(1)+'%';
  $('hero-attack').disabled=!w||state.broken;$('hero-attack').hidden=!w;$('hero-attack').textContent='攻撃';
  $('hero-defend').hidden=!h.monster||h.monster.phase==='retreating';
  $('hero-threat').hidden=!h.monster||!visible;
  $('game').classList.toggle('hero-under-attack',Boolean(h.monster&&visible));
  if(h.monster){
   const m=h.monster,d=Math.round(Math.hypot(m.x-state.x,m.y-state.y)*.12),angle=Math.atan2(renderer.screen(m.x,m.y).y-renderer.screen(state.x,state.y,state.deck??0).y,renderer.screen(m.x,m.y).x-renderer.screen(state.x,state.y,state.deck??0).x);
   $('hero-threat-name').textContent=(m.kind?'潮甲獣 アオナギ':'岩角獣 ガンロウ')+(m.phase==='retreating'?'　撤退中 / 無敵':m.phase==='approaching'?'　接近中':'　'+Math.ceil(m.hp)+' HP');
   $('hero-threat-distance').textContent=d+' m';
   $('hero-threat-arrow').style.transform='rotate('+angle+'rad)';
   $('hero-threat-health').style.transform='scaleX('+m.hp/m.maxHp+')';
  }
 }};
}
export function mountHeroShop({state,save,onAction}){
 const root=$('hero-shop');
 function render(){
  const site=shopAt(state),mode=state.shopTab??'machines';root.replaceChildren();
  const title=document.createElement('h3');title.textContent=mode==='weapons'?'武器・装備':'マシンの購入';root.append(title);
  const note=document.createElement('p');note.textContent='装備する車両：'+vehicles[state.vehicle].name+'。';root.append(note);
  function row(name,description,label,disabled,fn){const el=document.createElement('div');el.className='hero-shop-row';const h=document.createElement('strong'),p=document.createElement('p'),b=document.createElement('button');h.textContent=name;p.textContent=description;b.type='button';b.textContent=label;b.disabled=disabled;b.addEventListener('keydown',e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();});b.onclick=()=>{const result=fn();$('garage-feedback').textContent=result.message;if(result.ok){save();onAction?.();}render();};el.append(h,p,b);root.append(el);}
  row('車体の修復','今乗っている車体を即時に全回復。','修復 '+repairCost(vehicles[state.vehicle].hp*(1+state.upgrades[state.vehicle][3]*.2)-state.health[state.vehicle])+' pt',!site||state.health[state.vehicle]>=vehicles[state.vehicle].hp*(1+state.upgrades[state.vehicle][3]*.2),()=>shopPurchase(state,'repair'));
  if(mode==='machines')for(const [id,basePrice] of Object.entries(machinePrices)){const price=machinePrice(state,Number(id));const v=vehicles[Number(id)],owned=state.hero.owned[Number(id)];row(v.name,v.description+'　耐久 '+v.hp+' HP',owned?'購入済み':price+' ptで購入',owned||!site||state.points<price,()=>shopPurchase(state,'vehicle',id));}
  if(mode==='weapons'&&state.vehicle!==10)for(const [i,w] of weaponSpecs.entries()){
   const owned=state.hero.weapons.includes(w.id),level=state.hero.weaponLevels[i],equipped=state.hero.equipment[state.vehicle]===w.id;
   row(w.name+' Lv.'+level,w.description+'　射程 '+Math.round(w.range*.12)+'m / 威力 '+Math.round(w.damage*(1+level*.3))+'/秒',owned?(equipped?'装備を外す':'この車に装備'):w.cost+' ptで購入・装備',!site||!owned&&state.points<w.cost,()=>shopPurchase(state,'weapon',w.id));
   if(owned)row(w.name+'の強化','威力 '+Math.round(w.damage*(1+level*.3))+' → '+Math.round(w.damage*(1+Math.min(3,level+1)*.3))+'/秒',level>=3?'最大Lv.3':weaponUpgradeCost(level)+' ptで強化',!site||level>=3||state.points<weaponUpgradeCost(level),()=>shopPurchase(state,'weapon-upgrade',w.id));
  }
  if(mode==='weapons'){
   if(state.vehicle===10)for(const [id,w] of Object.entries(robotWeapons))row(w.name,'標準装備 / 威力 '+w.damage+' / 射程 '+Math.round(w.range*.12)+'m',state.hero.robot.weapon===id?'選択中':'この武器に切替',state.hero.robot.weapon===id,()=>{state.hero.robot.weapon=id;return {ok:true,message:w.name+'に切り替えました。'};});
   const progress=updateRobotProgress(state,population(state)),heading=document.createElement('h3');heading.textContent='封印されしロボ '+progress.parts.length+' / 6';root.append(heading);
   const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='封印解除の条件';details.append(summary);
   for(const part of robotParts){const p=document.createElement('p');p.textContent=part.name+'：'+part.condition+(progress.unlocks.includes(part.id)?'（達成）':'');details.append(p);if(progress.unlocks.includes(part.id)){const owned=progress.parts.includes(part.id);row(part.name,part.condition,owned?'購入済み':part.cost.toLocaleString('ja-JP')+' ptで購入',owned||!site||state.points<part.cost,()=>shopPurchase(state,'robot-part',part.id));}}
   root.append(details);
  }


 }
 return {render};
}
