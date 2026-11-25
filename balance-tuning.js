// Shared by real job payments and the deterministic economy review.
export function seasonalWorkBonus(s){const c=s.hero?.city;return c&&s.hero.day<c.seasonUntil?c.season==='rainy'?1.14:c.season==='winter'?1.22:1:1;}
export function jobPayout(s,job,rankMultiplier=1){return Math.round(job.reward*rankMultiplier*(s.hero?.city?.reward??1)*seasonalWorkBonus(s)+1e-7);}
export const repairCost=missing=>Math.max(10,Math.ceil(missing*.45));
