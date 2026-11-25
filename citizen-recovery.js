// Population temporarily excludes injured/evacuated citizens, never deaths.
const clock=h=>(h.day-1)*480+h.clock;
export function recordAbsence(s,count=1){
 const h=s.hero;if(!h||count<=0)return;count=Math.min(Math.floor(count),10000000-h.casualties);h.casualties+=count;
 const returnAt=Math.ceil((clock(h)+120)/10)*10,queue=h.evacuations??=[];
 const group=queue.find(g=>g.returnAt===returnAt);if(group)group.count+=count;else if(queue.length<128)queue.push({returnAt,count});else{queue.at(-1).count+=count;queue.at(-1).returnAt=Math.max(queue.at(-1).returnAt,returnAt);}
}
export function returnCitizens(h){
 const now=clock(h);h.evacuations=(h.evacuations??[]).filter(g=>{if(g.returnAt>now)return true;h.casualties=Math.max(0,h.casualties-g.count);return false;});
}
export function validEvacuations(h){return h.evacuations===undefined||Array.isArray(h.evacuations)&&h.evacuations.length<=128&&h.evacuations.every(g=>g&&Number.isInteger(g.count)&&g.count>=0&&g.count<=10000000&&Number.isFinite(g.returnAt)&&g.returnAt>=0&&g.returnAt<=48000000+1000)&&h.evacuations.reduce((n,g)=>n+g.count,0)<=h.casualties;}
