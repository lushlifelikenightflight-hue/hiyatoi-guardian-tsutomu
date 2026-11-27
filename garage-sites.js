import {serviceBays} from './service-bays.js?v=5.6.1';
const selected=['service-park','service-west','service-east','service-terminus'];
export const machineGarages=selected.map((id,i)=>{const b=serviceBays.find(b=>b.id===id);return {...b,name:['木陰ガレージ','軒先ガレージ','光庭ガレージ','花帆ガレージ'][i],garage:true,w:104,d:100,h:62,angle:b.heading-Math.PI/2};});
export function garageContaining(s){if(s.z>3||s.deck>4)return null;return machineGarages.find(b=>{const dx=s.x-b.x,dy=s.y-b.y,c=Math.cos(b.heading),n=Math.sin(b.heading);return Math.abs(dx*c+dy*n)<37&&Math.abs(-dx*n+dy*c)<38;})??null;}
export function stoppedGarage(s){if(s.z>0||s.broken||s.pursuit||Math.abs(s.speed)>=3||Math.hypot(s.vx,s.vy)>=3)return null;return garageContaining(s);}
