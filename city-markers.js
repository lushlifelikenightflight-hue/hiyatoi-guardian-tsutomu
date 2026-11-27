import {cityObjectActive} from './city-evolution.js?v=5.6.0';
import {machineGarages} from './garage-sites.js?v=5.6.0';
import {world} from './world.js?v=5.6.0';
export function rebuildingSigns(s){return world.buildings.filter(b=>cityObjectActive(s,b)&&b.kind==='building'&&(s.damage[b.id]??0)>0&&s.hero.rebuild[b.id]!==undefined&&s.time>=s.hero.rebuild[b.id]).map(b=>({x:b.x,y:b.y,height:b.h+18,label:'再建設中',id:b.id}));}
export function drawGarageGlow(r,s){const g=r.g,z=r.zoom,pulse=r.reduced?1:.88+.12*Math.sin(s.time*2.5);g.save();
 for(const b of machineGarages){const c=Math.cos(b.heading),n=Math.sin(b.heading),points=[[-44,-42],[44,-42],[44,46],[-44,46]].map(([x,y])=>r.screen(b.x+c*x-n*y,b.y+n*x+c*y,2));
  if(points.every(p=>p.x< -160||p.x>r.canvas.width+160||p.y< -160||p.y>r.canvas.height+160))continue;
  g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle='rgba(111,238,210,.22)';g.fill();g.strokeStyle='#a8ffe0';g.shadowColor='#70edce';g.shadowBlur=16*z*pulse;g.lineWidth=3*z;g.stroke();
  const entrance=[[36,-35],[100,-35],[100,35],[36,35]].map(([x,y])=>r.screen(b.x+c*x-n*y,b.y+n*x+c*y,2));
  g.beginPath();entrance.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle='rgba(111,238,210,.27)';g.fill();g.stroke();
  for(const k of [1,2,3]){const tip=100-k*16,arrow=[[tip+6,-7],[tip,0],[tip+6,7]].map(([x,y])=>r.screen(b.x+c*x-n*y,b.y+n*x+c*y,3));g.beginPath();arrow.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();}
 }g.restore();}
export function drawCityMarkers(r,s){const g=r.g,z=r.zoom;g.save();
 const signs=[...machineGarages.map(b=>({x:b.x,y:b.y,height:b.h+26,label:'G  ガレージ',garage:true})),...rebuildingSigns(s)];
 for(const sign of signs){const p=r.screen(sign.x,sign.y,sign.height);if(p.x< -110||p.x>r.canvas.width+110||p.y< -40||p.y>r.canvas.height+40)continue;
  const size=Math.max(8,11*z);g.font=`bold ${size}px "Yu Gothic UI",sans-serif`;g.textAlign='center';g.textBaseline='middle';const w=g.measureText(sign.label).width+18*z,h=size+12*z;
  g.shadowColor=sign.garage?'#f4cb77':'#b5ebcc';g.shadowBlur=sign.garage?14*z:0;g.fillStyle=sign.garage?'#f1ce81':'#f0d6a0';g.fillRect(p.x-w/2,p.y-h/2,w,h);g.shadowBlur=0;g.strokeStyle='#304e49';g.lineWidth=1.5*z;g.strokeRect(p.x-w/2,p.y-h/2,w,h);g.fillStyle='#243f3b';g.fillText(sign.label,p.x,p.y);
  g.beginPath();g.moveTo(p.x-4*z,p.y+h/2);g.lineTo(p.x,p.y+h/2+6*z);g.lineTo(p.x+4*z,p.y+h/2);g.fillStyle=sign.garage?'#f1ce81':'#f0d6a0';g.fill();
 }g.restore();}
