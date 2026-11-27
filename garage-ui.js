import {mountHeroShop} from './hero-ui.js?v=5.6.1';
import {vehicles} from './vehicle-specs.js?v=5.6.1';
import {upgradeTypes,upgradeOffer,buyUpgrade,garageAt,garageSites,upgradeLimit} from './upgrades.js?v=5.6.1';

export function mountGarage({state,save,notify,chooseTarget,onPurchase}){
 const $=id=>document.getElementById(id),select=$('garage-vehicle');
 select.replaceChildren(...vehicles.map((v,i)=>new Option(v.name,String(i))));
 const heroShop=mountHeroShop({state,save,onAction:()=>{render();onPurchase?.();}});
 const display=(item,v)=>item.value(v).toFixed(1)+' '+item.unit;
 function render(focusKind){
  for(const [i,option] of [...select.options].entries()){option.disabled=state.hero.owned[i]!==true;option.textContent=vehicles[i].name+(option.disabled?'（未購入）':'');}
  if(state.hero.owned[Number(select.value)]!==true)select.value=String(state.hero.owned.findIndex(Boolean));
  const index=Number(select.value),site=garageAt(state);
  $('garage-balance').textContent=state.points.toLocaleString('ja-JP')+' pt';
  $('garage-title').textContent=(site?.name??'ガレージ')+' / マシン・武器ショップ';
  $('garage-location').textContent=site?site.name+'で整備中':state.broken?'修理してから強化できます。':'ガレージ・整備所の光る輪の中で停車すると購入できます。';
  $('garage-route').hidden=Boolean(site);
  const rows=upgradeTypes.map(item=>{
   const offer=upgradeOffer(state,index,item.id),row=document.createElement('div');row.className='upgrade-row';
   const title=document.createElement('h3');title.textContent=item.name;
   const level=document.createElement('span');level.textContent='Lv.'+offer.level+' / '+upgradeLimit;
   const values=document.createElement('p');values.className='upgrade-values';
   values.textContent=display(item,offer.current)+(offer.maxed?'（最大）':' → '+display(item,offer.next));
   const button=document.createElement('button');button.type='button';button.dataset.upgrade=item.id;
   button.textContent=offer.maxed?'強化済み':offer.cost.toLocaleString('ja-JP')+' ptで強化';
   button.setAttribute('aria-label',vehicles[index].short+'の'+item.name+'を強化、'+(offer.maxed?'最大レベル':offer.cost+' pt'));
   button.disabled=state.hero.owned[index]===false||offer.maxed||!site||state.points<offer.cost||state.health[index]<=0;
   const reason=document.createElement('small');reason.textContent=offer.maxed?'Lv.5まで強化済み':state.health[index]<=0?'先にこの車両を修理':!site?'ガレージで停車が必要':state.points<offer.cost?'あと '+(offer.cost-state.points).toLocaleString('ja-JP')+' pt':'次はLv.'+(offer.level+1);
   button.addEventListener('keydown',e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();});
   button.addEventListener('click',()=>{
    const result=buyUpgrade(state,index,item.id);
    if(result.ok){save();onPurchase?.();}
    $('garage-feedback').textContent=result.message;render(item.id);
   });
   row.append(title,level,values,button,reason);return row;
  });
  $('upgrade-list').replaceChildren(...rows);heroShop.render();
  if(focusKind){const button=$('upgrade-list').querySelector('[data-upgrade="'+focusKind+'"]');if(!button.disabled)button.focus();else select.focus();}
 }
 select.addEventListener('change',()=>{$('garage-feedback').textContent='';render();});
 $('garage-route').addEventListener('click',()=>{
  const site=garageSites.slice().sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];
  chooseTarget(site.id);
 });
 for(const tab of document.querySelectorAll('[data-shop-tab]'))tab.addEventListener('click',()=>{state.shopTab=tab.dataset.shopTab;showTab();render();});
 function showTab(){const upgrade=state.shopTab==='upgrades';$('garage-upgrades').hidden=!upgrade;$('hero-shop').hidden=upgrade;for(const b of document.querySelectorAll('[data-shop-tab]'))b.setAttribute('aria-pressed',String(b.dataset.shopTab===state.shopTab));}
 return {open(){state.shopTab='machines';showTab();select.value=String(state.vehicle);$('garage-feedback').textContent='';render();}};
}
