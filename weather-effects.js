import {harmCitizen} from './city-evolution.js?v=5.5.0';
import {weatherRandom} from './weather.js?v=5.5.0';
import {damageVehicle} from './physics.js?v=5.5.0';
import {hurtBuilding} from './hero-life.js?v=5.5.0';
import {world} from './world.js?v=5.5.0';
import {damageTraffic} from './traffic.js?v=5.5.0';
export function updateWeatherHazards(s,dt){
 const kind=s.hero.weather.kind;s.weatherHazards??=[];
 if(s.weatherHazardKind!==kind){s.weatherHazardKind=kind;s.nextWeatherHazard=s.time+3;}
 if(['storm','thunder','meteor'].includes(kind)&&s.time>=(s.nextWeatherHazard??Infinity)){
  const seed=s.hero.weather.serial*897+Math.floor(s.time*10),angle=weatherRandom(seed)*Math.PI*2,r=weatherRandom(seed+1)*230;
  s.weatherHazards.push({kind,x:s.x+Math.cos(angle)*r,y:s.y+Math.sin(angle)*r,at:s.time,impactAt:s.time+(kind==='meteor'?2:1.4),radius:kind==='meteor'?90:kind==='thunder'?46:32,hit:false});
  s.nextWeatherHazard=s.time+(kind==='meteor'?4:kind==='storm'?7:9)*(s.hero.city?.disaster??1);
 }
 for(const e of s.weatherHazards){if(e.hit||s.time<e.impactAt)continue;e.hit=true;
  const amount=e.kind==='meteor'?160:e.kind==='thunder'?85:30;
  if(Math.hypot(s.x-e.x,s.y-e.y)<e.radius&&s.z<25)damageVehicle(s,amount,'weather');
  for(const car of [...(s.traffic??[]),...(s.responses??[])])if(car.health>0&&Math.hypot(car.x-e.x,car.y-e.y)<e.radius)damageTraffic(car,amount,s.time);
  for(const b of world.buildings)if(Math.hypot(b.x-e.x,b.y-e.y)<e.radius+Math.min(b.w,b.d)*.4)hurtBuilding(s,b,amount*2);
  for(const person of s.crowd?.people??[])if(Math.hypot(person.x-e.x,person.y-e.y)<e.radius&&!s.struck.has(person.id)){harmCitizen(s,person);}
  s.events.push({type:'weather-hit',x:e.x,y:e.y,time:s.time});
 }
 s.weatherHazards=s.weatherHazards.filter(e=>s.time<e.impactAt+(e.kind==='meteor'?4.4:e.kind==='thunder'?2.3:1.2)).slice(-12);
 if(kind==='storm'&&!s.broken&&s.z<4){s.vx+=Math.sin(s.time*.8)*9*dt;s.vy+=Math.cos(s.time*.7)*6*dt;}
}
