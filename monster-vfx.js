import {monsterAttacks,beamHeightAt} from './monster-attacks.js?v=5.6.0';
import {drawPixelVfx} from './pixel-vfx.js?v=5.6.0';

function outline(r,a,fill,stroke){
 const g=r.g,spec=monsterAttacks[a.kind],point=(x,y)=>r.screen(x,y,3),at=(d,t)=>point(a.x+Math.cos(t)*d,a.y+Math.sin(t)*d);
 g.beginPath();
 if(a.kind==='stomp'||a.kind==='meteor'){
  for(let i=0;i<=48;i++){const t=i/48*Math.PI*2,p=point(a.targetX+Math.cos(t)*spec.radius,a.targetY+Math.sin(t)*spec.radius);if(!i)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);}
 }else if(a.kind==='slash'){
  const p=point(a.x,a.y);g.moveTo(p.x,p.y);for(let i=0;i<=32;i++){const p=at(spec.range,a.angle-spec.halfAngle+i/32*spec.halfAngle*2);g.lineTo(p.x,p.y);}
 }else{
  for(const [i,[d,w]] of [[0,[0,-1]],[1,[a.length??spec.range,-1]],[2,[a.length??spec.range,1]],[3,[0,1]]]){const p=point(a.x+Math.cos(a.angle)*d-Math.sin(a.angle)*w*spec.width/2,a.y+Math.sin(a.angle)*d+Math.cos(a.angle)*w*spec.width/2);if(!i)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);}
 }g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=stroke;g.lineWidth=Math.max(1.5,2*r.zoom);g.stroke();
}
function warning(r,a,t,progress){
 const g=r.g,spec=monsterAttacks[a.kind],pulse=r.reduced?.8:.7+.2*Math.sin(t*9);
 g.save();g.globalAlpha=pulse;outline(r,a,spec.color+'30',spec.color);
 const p=r.screen(a.targetX,a.targetY,8);g.fillStyle='#17262e';g.strokeStyle=spec.color;g.lineWidth=1.5;
 if(a.kind==='meteor'&&(p.x< -90||p.y< -90||p.x>r.canvas.width+90||p.y>r.canvas.height+90)){g.restore();return;}
 const font=Math.max(11,12*r.zoom);g.font=`bold ${font}px sans-serif`;g.textAlign='center';
 const width=g.measureText(spec.name).width+22,x=Math.max(width/2+8,Math.min(r.canvas.width-width/2-8,p.x)),y=Math.max(80,Math.min(r.canvas.height-150,p.y));g.fillRect(x-width/2,y-18-font,width,font+9);g.strokeRect(x-width/2,y-18-font,width,font+9);g.fillStyle='#fff5de';g.fillText(spec.name,x,y-14);
 g.fillStyle=spec.color;g.fillRect(x-width/2,y-9,width*Math.max(0,Math.min(1,progress)),2);g.restore();
}
function beam(r,a,age){
 const g=r.g,z=r.zoom,p=r.screen(a.x,a.y,a.originHeight??208),q=r.screen(a.targetX,a.targetY,a.targetHeight??8);
 g.save();g.globalAlpha=Math.max(0,1-age/1.05);g.lineCap='round';
 for(const [width,color] of [[58,'#5cb5ed24'],[34,'#6ae4ff60'],[16,'#72efff'],[6,'#f5ffff']]){g.lineWidth=width*z;g.strokeStyle=color;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();}
 for(let i=1;i<=8;i++){const t=i/8,x=a.x+(a.targetX-a.x)*t,y=a.y+(a.targetY-a.y)*t,p=r.screen(x,y,beamHeightAt(a,x,y));drawPixelVfx(g,'hit-spark',age,p.x,p.y,z*.7);}
 drawPixelVfx(g,'ground-slam',age,q.x,q.y,z*.65);
 g.restore();
}
function slash(r,a,age){
 const g=r.g,z=r.zoom,spec=monsterAttacks.slash;
 g.save();g.globalAlpha=Math.max(0,1-age/.8);g.lineCap='round';
 for(let claw=0;claw<3;claw++){
  const d=spec.range-28-claw*24;
  for(const [width,color] of [[20,'#ff5e6855'],[9,'#ff8e97'],[3,'#fff1da']]){g.lineWidth=width*z;g.strokeStyle=color;g.beginPath();for(let i=0;i<=24;i++){const angle=a.angle-spec.halfAngle+i/24*spec.halfAngle*2,p=r.screen(a.x+Math.cos(angle)*d,a.y+Math.sin(angle)*d,20+claw*15);if(!i)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);}g.stroke();}
 }g.restore();
}
export function drawMonsterVfx(r,s){
 const m=s.hero.monster,g=r.g,z=r.zoom;
 if(m&&m.phase!=='retreating'&&m.hp>0){
  if(m.windup>0){const a=m.attack??{kind:'stomp',x:m.x,y:m.y,angle:m.heading,targetX:m.strike?.x??m.x,targetY:m.strike?.y??m.y};
   if(a.kind==='meteor'&&a.targets){for(const p of a.targets)warning(r,{...a,targetX:p.x,targetY:p.y},s.time,1-m.windup/monsterAttacks.meteor.windup);}else warning(r,a,s.time,1-m.windup/monsterAttacks[a.kind].windup);
   if(a.kind==='beam'){const p=r.screen(a.x,a.y,a.originHeight??208),radius=(10+16*(1-m.windup/1.2))*z;g.save();const glow=g.createRadialGradient(p.x,p.y,1,p.x,p.y,radius*2);glow.addColorStop(0,'#ffffff');glow.addColorStop(.3,'#9df4ff');glow.addColorStop(1,'#54c4ff00');g.fillStyle=glow;g.beginPath();g.arc(p.x,p.y,radius*2,0,Math.PI*2);g.fill();g.restore();}
  }
  for(const p of m.projectiles??[]){warning(r,p,s.time,1-p.remaining/p.duration);const target=r.screen(p.targetX,p.targetY,3),q=r.screen(p.targetX+p.remaining*50,p.targetY-p.remaining*15,3+p.remaining/p.duration*420);g.save();g.strokeStyle='#ffa55c';g.lineWidth=9*z;g.beginPath();g.moveTo(q.x+25*z,q.y-70*z);g.lineTo(q.x,q.y);g.stroke();g.strokeStyle='#fff2c8';g.lineWidth=3*z;g.stroke();g.fillStyle='#fff5d8';g.beginPath();g.arc(q.x,q.y,9*z,0,Math.PI*2);g.fill();g.globalAlpha=.3;g.fillStyle='#b587dc';g.beginPath();g.ellipse(target.x,target.y,15*z,8*z,0,0,Math.PI*2);g.fill();g.restore();}
 }
 for(const e of s.combatEffects??[]){if(!e.attack)continue;const age=s.time-e.at,a=e.attack,p=r.screen(a.targetX,a.targetY,4);
  if(a.kind==='beam')beam(r,a,age);
  else if(a.kind==='slash')slash(r,a,age);
  else {drawPixelVfx(g,a.kind==='meteor'?'meteor':'ground-slam',a.kind==='meteor'?1.65+age:age,p.x,p.y,z*(a.kind==='meteor'?1:1.3));g.save();g.globalAlpha=Math.max(0,1-age/1.3);g.strokeStyle=a.kind==='meteor'?'#e3b0ff':'#ffd49d';g.lineWidth=4*z;g.beginPath();g.ellipse(p.x,p.y,(15+age*105)*z,(9+age*62)*z,0,0,Math.PI*2);g.stroke();g.restore();}
 }
}
