import {roadFootprintOverlap,segmentDistance} from './geometry.js?v=5.6.1';
import {groundHeight} from './elevation.js?v=5.6.1';
export const lotNames={parking:'月極駐車場',court:'街角コート',field:'市民運動場',farm:'市民菜園',orchard:'果樹の庭',yard:'資材置場',sale:'売地',plaza:'記念広場',backlot:'路地裏の中庭',ballpark:'市民球場'};
export const lotSizes={parking:[260,180],court:[230,180],field:[520,360],farm:[340,240],orchard:[360,260],yard:[310,220],sale:[340,240],plaza:[250,210],backlot:[180,150],ballpark:[640,500]};
export function createCityLots({roads,solids,pond,inPark,railClearance,west,width,height,reserved=[]}){
 const lots=[];let i=0;const fixed=solids.filter(o=>o.kind==='building'||o.kind==='station'||o.job||o.type==='serviceOffice');
 for(let y=380;y<height-300;y+=100)for(let x=west+300;x<width-300;x+=100){
  const raw=(Math.imul(Math.floor(x),173)+Math.imul(y,317))>>>0,seed=(Math.imul(raw^(raw>>>16),0x45d9f3b)^(raw>>>7))>>>0,suburb=y>3800||x< -1600||x>5200;
  const kinds=suburb?['ballpark','field','farm','orchard','yard','sale']:['parking','court','plaza','backlot','sale'],kind=kinds[seed%kinds.length],[w,d]=lotSizes[kind];
  const lot={id:'city-lot-'+i,x:x+(seed%47)-23,y:y+((seed>>>7)%43)-21,w,d,angle:0,kind,name:lotNames[kind],seed};
  if(lot.x-w/2<west+65||lot.x+w/2>width-65||lot.y-d/2<100||lot.y+d/2>height-100)continue;
  const samples=Array.from({length:5},(_,a)=>Array.from({length:5},(_,b)=>[(a/4-.5)*w,(b/4-.5)*d])).flat();
  if(samples.some(([a,b])=>pond(lot.x+a,lot.y+b)||(!['ballpark','field'].includes(kind)&&inPark(lot.x+a,lot.y+b)))||railClearance(lot.x,lot.y,Math.hypot(w,d)/2+22,500)||roads.some(r=>roadFootprintOverlap(lot,r,36))||Math.min(...roads.map(r=>segmentDistance(lot.x,lot.y,r)-r.w/2))>500)continue;
  if([...fixed,...reserved].some(o=>Math.abs(o.x-lot.x)<(o.w+w)/2+22&&Math.abs(o.y-lot.y)<(o.d+d)/2+22))continue;
  const heights=samples.map(([a,b])=>groundHeight(lot.x+a,lot.y+b));if(Math.max(...heights)-Math.min(...heights)>14)continue;
  lots.push(lot);i++;
 }const chosen=[],priority=['ballpark','field','plaza','parking','court','farm','orchard','yard','sale','backlot'];for(const p of lots.sort((a,b)=>priority.indexOf(a.kind)-priority.indexOf(b.kind)||a.seed-b.seed)){const max=p.kind==='ballpark'?1:p.kind==='field'?3:20;if(chosen.filter(o=>o.kind===p.kind).length>=max||chosen.some(o=>Math.abs(o.x-p.x)<(o.w+p.w)/2+25&&Math.abs(o.y-p.y)<(o.d+p.d)/2+25))continue;chosen.push({...p,id:'city-lot-'+chosen.length});}return chosen;
}
