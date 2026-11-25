export const SERVICE_RADIUS=38;
function bay(id,name,x,y,roadX,roadY,district){
 return {id,name,x,y,roadX,roadY,heading:Math.atan2(roadY-y,roadX-x),service:true,district};
}

export const serviceBays=[
 bay('service-park','風待ち公園の整備所',1443,2209,1498,2086,'park'),
 bay('service-west','西の軒先整備所',-1962,2290,-1830,2290,'west'),
 bay('service-east','光庭の整備所',4544,1807,4415,1836,'east'),
 bay('service-market','杏灯の整備所',-1583,4236,-1613,4382,'market'),
 bay('service-water','白波の整備所',1501,6406,1650,6406,'water'),
 bay('service-hill','花帆の丘の整備所',5208,5715,5166,5843,'hill'),
 bay('service-terminus','花帆駅の整備所',5123,7070,5126,7219,'terminus')
];

export const quietSpawn=serviceBays[0];

export function serviceDriveways(roads){
 return serviceBays.map(bay=>{
  const entrance=[bay.roadX,bay.roadY];
  let distance=Infinity,join=entrance;
  for(const {a,b} of roads){
   const dx=b[0]-a[0],dy=b[1]-a[1];
   const t=Math.max(0,Math.min(1,((entrance[0]-a[0])*dx+(entrance[1]-a[1])*dy)/(dx*dx+dy*dy)));
   const point=[a[0]+t*dx,a[1]+t*dy],d=Math.hypot(point[0]-entrance[0],point[1]-entrance[1]);
   if(d<distance){distance=d;join=point;}
  }
  return {a:join,b:[bay.x,bay.y],w:38,name:bay.name,theme:'service',park:true,alley:true,bridge:false};
 });
}
