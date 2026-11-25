export const machinePrices={1:6000,2:20000,3:4000,4:28000,5:55000,6:14000,7:48000,8:38000,9:90000};
export function machinePrice(s,index){const purchased=s.hero.owned.filter((v,i)=>i>=2&&v).length;return Math.ceil(machinePrices[index]*(1+purchased*.1)/100)*100;}
export const upgradeMultipliers=[1,2.2,4.8,9,16];
export const modificationFactors=[1,1.1,1.35,.8,1.6,1.8,1.3,1.6,1.5,2.2,4];
export const modificationCost=(item,index,level)=>Math.ceil(item.baseCost*upgradeMultipliers[Math.min(level,4)]*modificationFactors[index]/50)*50;
export const weaponUpgradeCost=level=>[6500,18000,42000][level]??0;
