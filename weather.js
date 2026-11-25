export const weatherTypes={
 sun:{name:'晴れ',road:'乾いた路面',max:1,accel:1,brake:1,grip:1,steer:1},
 cloud:{name:'曇り',road:'乾いた路面',max:1,accel:1,brake:1,grip:1,steer:1},
 rain:{name:'雨',road:'濡れた路面・滑りやすい',max:.96,accel:.94,brake:.82,grip:.7,steer:.92},
 storm:{name:'嵐',road:'強風と飛来物に注意',max:.9,accel:.88,brake:.75,grip:.62,steer:.88},
 thunder:{name:'雷雨',road:'落雷の予兆から離れよう',max:.94,accel:.92,brake:.8,grip:.68,steer:.9},
 snow:{name:'雪',road:'積雪・早めに減速',max:.86,accel:.8,brake:.6,grip:.48,steer:.8},
 meteor:{name:'流星群',road:'落下地点の赤い輪に注意',max:1,accel:1,brake:1,grip:1,steer:1}
};
export const weatherRandom=n=>{let h=(n+0x9e3779b9)>>>0;h=Math.imul(h^(h>>>16),0x21f0aaad);h=Math.imul(h^(h>>>15),0x735a2d97);return ((h^(h>>>15))>>>0)/4294967296;};
export const newWeather=()=>({kind:'sun',until:120,serial:0});
export const validWeather=w=>w&&Object.hasOwn(weatherTypes,w.kind)&&Number.isFinite(w.until)&&w.until>=0&&w.until<=1e9&&Number.isSafeInteger(w.serial)&&w.serial>=0&&w.serial<=1e7;
export function chooseWeather(n){const r=weatherRandom(n);return r<.62?'sun':r<.82?'cloud':r<.95?'rain':r<.97?'storm':r<.985?'thunder':r<.999?'snow':'meteor';}
export function updateWeather(s){
 const w=s.hero.weather??=newWeather(),now=(s.hero.day-1)*480+s.hero.clock;
 // A skipped day selects the current forecast, without replaying old hazards.
 if(now>=w.until){w.serial++;w.kind=chooseWeather(w.serial+s.hero.day*173);const c=s.hero.city,season=c&&s.hero.day<c.seasonUntil?c.season:'normal',roll=weatherRandom(w.serial*53);if(season==='rainy')w.kind=roll<.7?'rain':'cloud';if(season==='winter')w.kind=roll<.7?'snow':'cloud';if(season==='spring')w.kind=roll<.85?'sun':'cloud';if(['storm','thunder','meteor'].includes(w.kind)&&weatherRandom(w.serial*37)>1/(c?.disaster??1))w.kind='cloud';w.until=now+(w.kind==='meteor'?22:90+weatherRandom(w.serial*19)*90);}
 return w;
}
export const weatherHandling=s=>weatherTypes[s.hero?.weather?.kind]??weatherTypes.sun;
export const crowdTimeLevels=[.1,.015,.28,.55,.78,1,.55,.25];
export function crowdActivity(s){if(!s.hero)return 1;const hour=(6+s.hero.clock/480*24)%24,day=crowdTimeLevels[Math.floor(hour/3)],w=s.hero.weather?.kind;return day*(s.hero.city?.crowd??1)*(w==='storm'?.3:w==='rain'||w==='thunder'?.65:w==='snow'?.55:1);}
