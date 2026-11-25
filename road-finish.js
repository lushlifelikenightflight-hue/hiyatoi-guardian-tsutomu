export const roadColor=r=>r.park?'#b0b48d':r.alley?'#9a9a86':'#7c8982';
export const junctionRadius=(j,roads)=>Math.max(...j.roads.map(i=>roads[i].w))*.72+8;
export function paintRoadJoins(g,segments,junctions,roads){g.save();g.beginPath();for(const r of segments){const a=Math.atan2(r.b[1]-r.a[1],r.b[0]-r.a[0]),n=[-Math.sin(a)*r.w/2,Math.cos(a)*r.w/2];g.moveTo(r.a[0]+n[0],r.a[1]+n[1]);g.lineTo(r.b[0]+n[0],r.b[1]+n[1]);g.arc(...r.b,r.w/2,a+Math.PI/2,a-Math.PI/2,true);g.lineTo(r.a[0]-n[0],r.a[1]-n[1]);g.arc(...r.a,r.w/2,a-Math.PI/2,a+Math.PI/2,true);g.closePath();}g.clip();
 for(const j of junctions){const r=j.roads.map(i=>roads[i]).sort((a,b)=>b.w-a.w)[0];g.fillStyle=roadColor(r);g.beginPath();g.arc(j.x,j.y,junctionRadius(j,roads),0,Math.PI*2);g.fill();}g.restore();}
