import {makeCanvas} from './canvas-factory.js?v=5.5.0';
import {world,isDestroyed} from './world.js?v=5.5.0';
const stops=[[0,.8],[3,.8],[4,.76],[5,.52],[6,.1],[7,0],[17,0],[18,.25],[19,.46],[20,.65],[21,.74],[22,.79],[24,.8]];
export function nightDarkness(hour){hour=(hour%24+24)%24;for(let i=1;i<stops.length;i++)if(hour<=stops[i][0]){const [a,x]=stops[i-1],[b,y]=stops[i];return x+(y-x)*(hour-a)/(b-a);}return 0;}
export const gameHour=s=>(6+(s.hero?.clock??0)/480*24)%24;
const lamps=world.props.filter(o=>['lamp','lantern'].includes(o.type));
export function lightFalloff(distance){const t=Math.max(0,Math.min(1,distance));return 1-t*t*t*(10+t*(-15+6*t));}
export function nightLights(s){const lights=[{id:'player',x:s.x,y:s.y,height:s.deck??0,radius:s.vehicle===10?190:150,strength:.97,body:s.vehicle===10?70:12}];
 for(const o of lamps)if(!isDestroyed(s,o.id)&&Math.hypot(o.x-s.x,o.y-s.y)<1500)lights.push({id:o.id,x:o.x,y:o.y,height:0,radius:o.type==='lantern'?65:95,strength:.91,body:o.h*.35});return lights;}
export function drawNightVisibility(r,s){const darkness=nightDarkness(gameHour(s));if(darkness<.005)return;const W=r.canvas.width,H=r.canvas.height,z=r.zoom;
 const layer=r.nightMask??=makeCanvas();if(layer.width!==W||layer.height!==H){layer.width=W;layer.height=H;}const g=layer.getContext('2d');g.clearRect(0,0,W,H);g.globalCompositeOperation='source-over';g.fillStyle='rgba(2,7,15,'+darkness+')';g.fillRect(0,0,W,H);g.globalCompositeOperation='destination-out';
 const lights=nightLights(s);for(const light of lights){const p=r.screen(light.x,light.y,light.height+light.body),radius=light.radius*z;if(p.x+radius<0||p.x-radius>W||p.y+radius<0||p.y-radius>H)continue;g.save();g.translate(p.x,p.y);g.scale(1,.75);const gradient=g.createRadialGradient(0,0,0,0,0,radius);for(let i=0;i<=16;i++)gradient.addColorStop(i/16,'rgba(0,0,0,'+light.strength*lightFalloff(i/16)+')');g.fillStyle=gradient;g.fillRect(-radius,-radius,radius*2,radius*2);g.restore();}
 g.globalCompositeOperation='source-over';r.g.drawImage(layer,0,0);
 // Visible lamp bulbs remain readable without making the whole street bright.
 for(const light of lights.slice(1)){const o=world.byId.get(light.id),p=r.screen(light.x,light.y,o.h);r.g.save();r.g.fillStyle='#ffe7ad';r.g.shadowColor='#ffce83';r.g.shadowBlur=10*z;r.g.fillRect(p.x-2*z,p.y-2*z,4*z,4*z);r.g.restore();}
}
