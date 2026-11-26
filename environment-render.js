import {makeCanvas} from './canvas-factory.js?v=5.4.0';
import {drawPixelVfx} from './pixel-vfx.js?v=5.4.0';
import {weatherRandom} from './weather.js?v=5.4.0';
import {isDestroyed} from './world.js?v=5.4.0';
export function industrialStack(b){
 const w=Math.ceil(b.w/2),d=Math.ceil(b.d/2),h=Math.ceil(b.h/2),layers=[];
 for(let z=0;z<h;z++){const im=makeCanvas();im.width=w;im.height=d;const g=im.getContext('2d');
  if(b.industrial==='scrap'){for(let i=0;i<9;i++){g.fillStyle=['#52696b','#8d7762','#a2a48f'][i%3];const x=3+(i*11)%Math.max(4,w-14),y=3+(i*7)%Math.max(4,d-8);if(z<4+(i%4)*3)g.fillRect(x,y,12,3);}}
  else{g.fillStyle=z%3?'#8a8e7b':'#6a7470';for(let x=1;x<w-2;x+=5)if(z<h*(.5+weatherRandom(x)*.5))g.fillRect(x,2,5,3);g.fillRect(2,2,3,d-3);g.fillRect(w-5,2,3,d-3);if(b.industrial==='abandoned'&&z>h-4){g.fillStyle='#5b7777';g.fillRect(0,0,w,d);}if(z<5){g.fillStyle='#555f58';g.fillRect(1,3,w-2,d-5);}}
  layers.push(im);
 }return {layers,w,d,unit:2};
}
export function drawNightGround(r,s){
 if(r.mode!=='night')return;const g=r.g,z=r.zoom;
 for(const o of r.static){if(o.kind!=='prop'||!['lamp','lantern'].includes(o.data.type)||isDestroyed(s,o.data.id)||Math.hypot(o.x-s.x,o.y-s.y)>850)continue;
  const p=r.screen(o.x,o.y,1);g.save();g.translate(p.x,p.y);g.scale(1,.56);const glow=g.createRadialGradient(0,0,2,0,0,65*z);glow.addColorStop(0,'rgba(255,224,155,.48)');glow.addColorStop(.5,'rgba(255,204,125,.2)');glow.addColorStop(1,'rgba(255,210,141,0)');g.fillStyle=glow;g.fillRect(-65*z,-65*z,130*z,130*z);g.restore();
 }
}
export function drawWindows(r,s,o){
 if(r.mode!=='night'||o.data.vacant)return;const g=r.g,z=r.zoom,b=o.data,angle=b.angle??0,c=Math.cos(angle),n=Math.sin(angle);g.save();g.fillStyle='#ffe3a2';
 for(let floor=17;floor<o.height-8;floor+=20)for(let at=-b.w/2+12;at<b.w/2-8;at+=19){if(weatherRandom(Math.floor(at+floor*17+b.x))>.7)continue;const p=r.screen(o.x+c*at-n*(b.d/2+1),o.y+n*at+c*(b.d/2+1),floor);g.globalAlpha=.8;g.fillRect(p.x-2*z,p.y-4*z,4*z,6*z);}
 g.restore();
}
export function drawWeather(r,s){
 const kind=s.hero.weather?.kind??'sun',g=r.g,z=r.zoom,W=r.canvas.width,H=r.canvas.height,time=s.time;const c=s.hero.city,season=c&&s.hero.day<c.seasonUntil?c.season:'normal';if(season==='winter'){g.fillStyle='rgba(236,244,231,.12)';g.fillRect(0,0,W,H);}if(season==='spring'){g.save();g.fillStyle='#edb7bd';for(let i=0;i<40;i++){const x=(weatherRandom(i*61)*W+time*13)%(W+20)-10,y=(weatherRandom(i*43)*H+time*20)%(H+20)-10;g.fillRect(x,y,3*z,2*z);}g.restore();}
 if(kind!=='sun'&&kind!=='meteor'){g.fillStyle=kind==='snow'?'rgba(193,214,214,.1)':kind==='cloud'?'rgba(70,91,109,.1)':'rgba(35,58,78,.18)';g.fillRect(0,0,W,H);}
 if(['rain','storm','thunder','snow'].includes(kind)){
  const snow=kind==='snow';g.save();g.strokeStyle='rgba(175,217,232,.55)';g.fillStyle='#eff7ef';g.lineWidth=z;
  for(let i=0;i<(snow?90:135);i++){const x=(weatherRandom(i*31)*W+time*(snow?12:kind==='storm'?130:40))%(W+40)-20,y=(weatherRandom(i*37+4)*H+time*(snow?28:410))%(H+50)-25;if(snow){g.beginPath();g.arc(x+Math.sin(time+i)*5,y,1.4*z,0,Math.PI*2);g.fill();}else{g.beginPath();g.moveTo(x,y);g.lineTo(x+(kind==='storm'?8:3)*z,y+12*z);g.stroke();}}
  g.restore();
 }
 for(const e of s.weatherHazards??[]){const p=r.screen(e.x,e.y,2),until=e.impactAt-time;g.save();
  if(until>0){g.strokeStyle='#f3ac82';g.fillStyle='rgba(222,95,48,.13)';g.lineWidth=2*z;g.setLineDash([8*z,6*z]);g.beginPath();g.ellipse(p.x,p.y,e.radius*z,e.radius*z*.56,0,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);}
  if(e.kind==='meteor'){const age=until>0?Math.max(0,.6*(1-until/2)):.67-until;drawPixelVfx(g,'meteor',age,p.x,p.y,z*1.2);}
  else if(e.kind==='thunder'){const age=until>0?Math.max(0,.73*(1-until/1.4)):.8-until;drawPixelVfx(g,'lightning-strike',age,p.x,p.y,z);}
  else if(until>0){const q=r.screen(e.x-until*45,e.y,until*240);g.translate(q.x,q.y);g.rotate(time*4);g.fillStyle='#786b55';g.fillRect(-9*z,-4*z,18*z,8*z);g.fillStyle='#c5b08d';g.fillRect(-8*z,-3*z,12*z,2*z);}
  else drawPixelVfx(g,'ground-slam',-until,p.x,p.y,z*.5);
  g.restore();
 }
}
