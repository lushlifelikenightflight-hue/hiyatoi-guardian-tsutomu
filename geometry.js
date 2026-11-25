export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function segmentDistance(x,y,r){const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],length2=dx*dx+dy*dy,t=length2?clamp(((x-r.a[0])*dx+(y-r.a[1])*dy)/length2,0,1):0;return Math.hypot(x-r.a[0]-dx*t,y-r.a[1]-dy*t);}
export function insidePolygon(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
export function intersection(a,b){const ax=a.b[0]-a.a[0],ay=a.b[1]-a.a[1],bx=b.b[0]-b.a[0],by=b.b[1]-b.a[1],den=ax*by-ay*bx;if(Math.abs(den)<.001)return null;const cx=b.a[0]-a.a[0],cy=b.a[1]-a.a[1],t=(cx*by-cy*bx)/den,u=(cx*ay-cy*ax)/den;if(t<-.001||t>1.001||u<-.001||u>1.001)return null;return [a.a[0]+t*ax,a.a[1]+t*ay];}
export function circleRect(x,y,r,b){const cx=clamp(x,b.x-b.w/2,b.x+b.w/2),cy=clamp(y,b.y-b.d/2,b.y+b.d/2);return (x-cx)**2+(y-cy)**2<r*r;}
export function roadFootprintOverlap(b,r,margin=0){
 const radius=r.w/2+margin,c=Math.cos(b.angle??0),s=Math.sin(b.angle??0),hx=(Math.abs(c)*b.w+Math.abs(s)*b.d)/2,hy=(Math.abs(s)*b.w+Math.abs(c)*b.d)/2;
 if(b.x+hx<Math.min(r.a[0],r.b[0])-radius||b.x-hx>Math.max(r.a[0],r.b[0])+radius||b.y+hy<Math.min(r.a[1],r.b[1])-radius||b.y-hy>Math.max(r.a[1],r.b[1])+radius)return false;
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>[b.x+c*x*b.w/2-s*y*b.d/2,b.y+s*x*b.w/2+c*y*b.d/2]);
 for(const p of [r.a,r.b]){const x=(p[0]-b.x)*c+(p[1]-b.y)*s,y=-(p[0]-b.x)*s+(p[1]-b.y)*c;if(Math.hypot(Math.max(0,Math.abs(x)-b.w/2),Math.max(0,Math.abs(y)-b.d/2))<radius)return true;}
 return corners.some((p,i)=>segmentDistance(...p,r)<radius||intersection(r,{a:p,b:corners[(i+1)%4]}));
}
export function convexHull(points){const p=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lo=[],hi=[];for(const q of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
