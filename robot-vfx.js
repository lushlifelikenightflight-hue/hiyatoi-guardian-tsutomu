import {robotWeapon} from './robot-motion.js?v=5.6.1';
// Layered local Canvas effects: bounded analytic particles, no persistent particle objects or new canvases.
export function drawRobotAttacks(r,s){drawSwordTrail(r,s);const g=r.g,z=r.zoom;let count=0;
 for(let i=(s.combatEffects?.length??0)-1;i>=0;i--){const e=s.combatEffects[i];if(!['robot-rifle','beam-sword'].includes(e.kind)||!e.origin)continue;const age=s.time-e.at,duration=e.kind==='robot-rifle'?.42:.52;if(age<0||age>duration||count++>=8)continue;if(r.reduced&&count>1)continue;
  const a=r.screen(e.origin.x,e.origin.y,(s.deck??0)+e.origin.height),b=r.screen(e.x,e.y,(s.deck??0)+(e.height??0)),t=age/duration,fade=(1-t)*(r.reduced?.5:1),cyan=e.kind==='robot-rifle',color=cyan?'#64e9ef':'#ed72c3',light=cyan?'#dcffff':'#fff0fc';g.save();g.globalAlpha=fade;g.lineCap='round';
  if(cyan){const dx=b.x-a.x,dy=b.y-a.y,angle=Math.atan2(dy,dx),pulse=Math.max(0,1-age/.18);g.strokeStyle=color;g.lineWidth=12*z*pulse;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.strokeStyle=light;g.lineWidth=3*z*pulse;g.stroke();
   if(pulse>0){for(const [radius,width] of [[13,2],[23,1]]){g.strokeStyle=color;g.lineWidth=width*z;g.beginPath();g.ellipse(a.x,a.y,radius*z*pulse,radius*.55*z*pulse,angle,0,Math.PI*2);g.stroke();}for(let k=0;k<4;k++){const q=angle+Math.PI/4+k*Math.PI/2;g.strokeStyle=k%2?color:light;g.lineWidth=(k%2?3:5)*z;g.beginPath();g.moveTo(a.x+Math.cos(q)*4*z,a.y+Math.sin(q)*4*z);g.lineTo(a.x+Math.cos(q)*25*z*pulse,a.y+Math.sin(q)*25*z*pulse);g.stroke();}}
   if(!r.reduced){const travel=Math.min(1,age/.08),tail=Math.max(0,travel-.2);g.strokeStyle=light;g.lineWidth=6*z;g.beginPath();g.moveTo(a.x+dx*tail,a.y+dy*tail);g.lineTo(a.x+dx*travel,a.y+dy*travel);g.stroke();}
  }
  if(e.hit===false){g.restore();continue;}
  // Contact crown, outward hot fragments, cooler falling debris and a ground pressure ring.
  const ring=(8+t*32)*z;g.strokeStyle=color;g.lineWidth=3*z*(1-t)+.5;g.beginPath();g.ellipse(b.x,b.y,ring,ring*.65,0,0,Math.PI*2);g.stroke();g.fillStyle=light;g.globalAlpha=fade*Math.max(0,1-age/.16);g.beginPath();g.arc(b.x,b.y,(12*(1-t)+2)*z,0,Math.PI*2);g.fill();g.globalAlpha=fade;
  const n=r.reduced?6:18;for(let k=0;k<n;k++){const angle=k*2.39996+e.at,velocity=25+(k*17)%65,life=Math.max(0,1-age/(.22+(k%4)*.08)),distance=velocity*age,px=b.x+Math.cos(angle)*distance*z,py=b.y+Math.sin(angle)*distance*.7*z+(age*age*90-age*25)*z;g.globalAlpha=fade*life;g.fillStyle=k%3===0?'#e2a36c':k%3===1?color:light;const size=(k%3+1)*z;g.fillRect(Math.round(px),Math.round(py),size*2,size);}
  if((e.height??0)<35){const q=r.screen(e.x,e.y,1);g.globalAlpha=fade*.25;g.fillStyle=cyan?'#578c8a':'#9a6385';g.beginPath();g.ellipse(q.x,q.y,35*z,19*z,0,0,Math.PI*2);g.fill();g.globalAlpha=fade*.4;g.strokeStyle=color;g.lineWidth=2*z;g.beginPath();g.ellipse(q.x,q.y,(10+t*55)*z,(6+t*30)*z,0,0,Math.PI*2);g.stroke();}
  g.restore();
 }
}

function drawSwordTrail(r,s){if(s.vehicle!==10||s.hero.robot?.weapon!=='sword')return;const rig=robotWeapon(s);if(!['strike','recover'].includes(rig.pose.swordStage))return;const g=r.g,z=r.zoom,steps=r.reduced?1:4,point=p=>r.screen(p.x,p.y,(s.deck??0)+s.z+p.height);let previous=rig;
 g.save();for(let k=1;k<=steps;k++){const older=robotWeapon({...s,time:s.time-k*.035});if(older.pose.swordStage==='none')break;const a=point(previous.grip),b=point(previous.tip),c=point(older.tip),d=point(older.grip);g.fillStyle=k===1?'#ffcdf1':'#dc68b7';g.globalAlpha=(steps+1-k)/(steps+1)*.23;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(c.x,c.y);g.lineTo(d.x,d.y);g.closePath();g.fill();g.strokeStyle='#ffb8e8';g.lineWidth=(5-k)*z;g.globalAlpha=(steps+1-k)/(steps+1)*.35;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(c.x,c.y);g.stroke();previous=older;}g.restore();}
