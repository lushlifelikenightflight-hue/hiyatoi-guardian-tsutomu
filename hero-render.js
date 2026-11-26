import {drawRobotAttacks} from './robot-vfx.js?v=5.5.0';
import {drawPixelVfx} from './pixel-vfx.js?v=5.5.0';
import {monsterStack} from './hero-art.js?v=5.5.0';
import {bakeStack,drawSprite,YAW} from './art.js?v=5.5.0';
import {world,civicSites,isDestroyed} from './world.js?v=5.5.0';
import {activeWeapon,weaponAim} from './hero-combat.js?v=5.5.0';
import {railProjection} from './rail-drive.js?v=5.5.0';

export function drawMonster(renderer,s,upper=false){
 const m=s.hero.monster;if(!m)return;
 const pose=m.walking&&!m.windup?Math.floor((m.walkDistance??0)/19)%4:0,bob=m.walking&&!renderer.reduced?Math.abs(Math.sin((m.walkDistance??0)/38*Math.PI))*3:0;
 const g=renderer.g,z=renderer.zoom,p=renderer.screen(m.x,m.y,bob),facing=((Math.round((m.heading-Math.PI/2+YAW)/(Math.PI*2)*16)%16)+16)%16,key=m.kind+'-'+facing+'-'+pose;
 renderer.monsterSprites??=new Map();
 if(!renderer.monsterSprites.has(key)){renderer.monsterModels??=new Map();const modelKey=m.kind+'-'+pose;if(!renderer.monsterModels.has(modelKey))renderer.monsterModels.set(modelKey,monsterStack(m.kind,pose));renderer.monsterSprites.set(key,bakeStack(renderer.monsterModels.get(modelKey),facing/16*Math.PI*2,2));if(renderer.monsterSprites.size>48)renderer.monsterSprites.delete(renderer.monsterSprites.keys().next().value);}
 const rail=railProjection(m.x,m.y),split=rail&&rail.gap<200&&rail.height>20;if(upper&&!split)return;
 g.save();if(split){const cut=renderer.screen(m.x,m.y,rail.height).y;g.beginPath();g.rect(0,upper?0:cut,renderer.canvas.width,upper?Math.max(0,cut):renderer.canvas.height);g.clip();}
 if(!upper){g.fillStyle='rgba(13,36,34,.35)';g.beginPath();g.ellipse(p.x,p.y,82*z,43*z,0,0,Math.PI*2);g.fill();}
 if(m.hitAt&&s.time-m.hitAt<.06)g.globalAlpha=.8;
 drawSprite(g,renderer.monsterSprites.get(key),p.x,p.y,z);g.globalAlpha=1;
 g.restore();
}
export function drawHeroGround(renderer,s){
 const g=renderer.g,z=renderer.zoom,m=s.hero.monster;
 for(const site of civicSites.filter(p=>['home','workshop'].includes(p.type))){const p=renderer.screen(site.x,site.y,2);if(p.x< -90||p.y< -80||p.x>renderer.canvas.width+90||p.y>renderer.canvas.height+80)continue;g.save();g.strokeStyle=site.type==='home'?'#b7f1d9':'#f1d095';g.fillStyle=site.type==='home'?'rgba(142,222,184,.14)':'rgba(231,192,119,.14)';g.lineWidth=3*z;g.beginPath();g.ellipse(p.x,p.y,38*z,23*z,0,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#fff0c2';g.font=`bold ${10*z}px sans-serif`;g.textAlign='center';g.fillText(site.type==='home'?'アジト / 整備':'整備工房',p.x,p.y-29*z);g.restore();}
}
export function drawHeroEffects(renderer,s){
 const g=renderer.g,z=renderer.zoom,b=s.attackBeam,w=activeWeapon(s);
 for(const shell of s.shells??[]){const p=renderer.screen(shell.x,shell.y,shell.height+(s.deck??0));g.save();g.fillStyle='#fff2b6';g.shadowColor='#ffac55';g.shadowBlur=12*z;g.beginPath();g.ellipse(p.x,p.y,7*z,4*z,s.heading+YAW,0,Math.PI*2);g.fill();g.strokeStyle='#dc783d';g.lineWidth=2*z;g.stroke();g.restore();}
 for(const e of s.combatEffects??[])if(e.kind==='cannon'){const p=renderer.screen(e.x,e.y,5),age=s.time-e.at;g.save();g.globalAlpha=Math.max(0,1-age);g.strokeStyle='#ffd284';g.lineWidth=4*z;g.beginPath();g.ellipse(p.x,p.y,(12+age*95)*z,(7+age*50)*z,0,0,Math.PI*2);g.stroke();g.restore();}
 for(const e of s.combatEffects??[]){if(e.hit===false||e.attack)continue;const age=s.time-e.at,p=renderer.screen(e.x,e.y,e.height??4),name=e.kind==='cannon'?'ground-slam':e.kind==='stomp'?'ground-slam':e.kind==='foot'?'ground-slam':'hit-spark',scale=e.kind==='stomp'?1.25:e.kind==='foot'?.3:.8;
  drawPixelVfx(g,name,renderer.reduced?Math.max(.2,age):age,p.x,p.y,z*scale,0,{alpha:e.kind==='foot'?.45:1});}

 if(b&&!['robot-rifle','beam-sword'].includes(b.kind)){const a=renderer.screen(b.x,b.y,(b.originHeight??17)+(s.deck??0)),end=renderer.screen(b.end.x,b.end.y,(b.height??0)+(s.deck??0)),angle=Math.atan2(end.y-a.y,end.x-a.x),distance=Math.hypot(end.x-a.x,end.y-a.y);
  if(b.kind==='flame'){drawPixelVfx(g,'flamethrower',s.time,a.x,a.y,Math.min(1.8*z,distance/112),angle);}
  else if(b.kind==='machinegun'){
   drawPixelVfx(g,'muzzle-smg',s.time,a.x,a.y,z*.7,angle,{pivot:[56,42]});g.save();g.strokeStyle='#fff0ba';g.shadowColor='#e8a85a';g.shadowBlur=7*z;g.lineWidth=2*z;
   for(let i=0;i<3;i++){const t=((s.time*13+i*.31)%1),tail=Math.max(0,t-.1);g.beginPath();g.moveTo(a.x+(end.x-a.x)*tail,a.y+(end.y-a.y)*tail);g.lineTo(a.x+(end.x-a.x)*t,a.y+(end.y-a.y)*t);g.stroke();}g.restore();
  }else{drawPixelVfx(g,'hit-spark',s.time%.5,end.x,end.y,.85*z);}
 }

 drawRobotAttacks(renderer,s);
 for(const f of s.hero.fires){const b=world.byId.get(f.id);if(!b||Math.hypot(b.x-s.x,b.y-s.y)>900)continue;const p=renderer.screen(b.x,b.y,b.h);for(let i=0;i<5;i++){const pulse=renderer.reduced?1:.75+.25*Math.sin(s.time*8+i);g.fillStyle=i%2?'#ef9f54':'#e56c48';g.beginPath();g.ellipse(p.x+(i-2)*9*z,p.y-13*z,7*z,22*z*pulse,0,0,Math.PI*2);g.fill();}}
 if(s.work?.id==='fire'&&s.work.hold>0){const b=world.byId.get(s.work.stops[0].fireBuilding),a=renderer.screen(s.x,s.y,19),p=b&&renderer.screen(b.x,b.y,b.h*.7);if(p){g.strokeStyle='#b5e8eb';g.lineWidth=4*z;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo((a.x+p.x)/2,Math.min(a.y,p.y)-45*z,p.x,p.y);g.stroke();}}
 if(s.work?.id==='ambulance'&&s.work.index===0&&s.work.hold===0){const q=s.work.stops[0],p=renderer.screen(q.x+27,q.y,2);g.fillStyle='#ead8a9';g.fillRect(p.x-7*z,p.y-3*z,14*z,6*z);g.fillStyle='#cf7961';g.fillRect(p.x-4*z,p.y-4*z,3*z,7*z);}
}
export function drawWeaponMount(renderer,s){
 const w=activeWeapon(s);if(!w)return;const g=renderer.g,z=renderer.zoom,c=Math.cos(s.heading),n=Math.sin(s.heading),p=renderer.screen(s.x,s.y,(s.deck??0)+s.z+24),front=renderer.screen(s.x+c*24,s.y+n*24,(s.deck??0)+s.z+24);
 g.save();g.strokeStyle='#253e45';g.lineWidth=(w.id==='saw'?8:5)*z;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(front.x,front.y);g.stroke();g.strokeStyle=w.color;g.lineWidth=(w.id==='saw'?4:2)*z;g.stroke();g.fillStyle='#8ba8a0';g.fillRect(p.x-5*z,p.y-4*z,10*z,7*z);if(w.id==='saw'){g.strokeStyle='#e7d8b7';g.lineWidth=2*z;g.beginPath();g.ellipse(front.x,front.y,12*z,5*z,s.heading+YAW,0,Math.PI*2);g.stroke();}g.restore();
}
export function drawRebuilding(renderer,s,o,p){
 const progress=s.hero.rebuildProgress?.[o.data.id]??0;if(progress<=0)return;const g=renderer.g,z=renderer.zoom;
 g.save();g.beginPath();g.rect(p.x-o.sprite.image.width*z,p.y-o.height*progress*z,o.sprite.image.width*z*2,o.height*z+100*z);g.clip();drawSprite(g,o.sprite,p.x,p.y,z,.8);g.restore();

}
export function drawWeaponAim(r,s){
 const w=activeWeapon(s);if(!w||s.broken)return;const aim=weaponAim(s,w),g=r.g,z=r.zoom,a=r.screen(aim.origin.x,aim.origin.y,(s.deck??0)+s.z+aim.origin.height),b=r.screen(aim.x,aim.y,(s.deck??0)+(aim.height??0)),margin=22;
 const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,dx>0?(r.canvas.width-margin-a.x)/dx:dx<0?(margin-a.x)/dx:1,dy>0?(r.canvas.height-margin-a.y)/dy:dy<0?(margin-a.y)/dy:1)),p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},size=Math.max(5,7*z);
 g.save();g.strokeStyle='#263f3c';g.lineWidth=3.5*z;g.beginPath();g.arc(p.x,p.y,size,0,Math.PI*2);g.stroke();g.strokeStyle=aim.locked?'#ffbb82':aim.blocked?'#f1a17f':'#fff0ba';g.lineWidth=1.4*z;g.setLineDash([4*z,6*z]);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(p.x,p.y);g.stroke();g.setLineDash([]);g.beginPath();g.arc(p.x,p.y,size,0,Math.PI*2);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){g.moveTo(p.x+dx*(size-2*z),p.y+dy*(size-2*z));g.lineTo(p.x+dx*(size+4*z),p.y+dy*(size+4*z));}g.stroke();g.restore();
}
