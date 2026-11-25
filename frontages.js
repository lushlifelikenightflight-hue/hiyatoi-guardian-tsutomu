function line(a,b){
 const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
 return {angle,span:Math.hypot(b[0]-a[0],b[1]-a[1]),x:a[0],y:a[1]};
}
function offset(street,along,side){
 const c=Math.cos(street.angle),s=Math.sin(street.angle);
 return [street.x+c*along-s*side,street.y+s*along+c*side];
}
const westMarket=line([-1830,1950],[-2580,2210]);
const westHouses=line([-2550,2510],[-1830,2670]);
const eastAvenue=line([4380,1680],[5160,1420]);
const eastShops=line([5160,1420],[6110,1270]);

export const frontages=[];
function row(id,street,side,start,end,spacing,roadHalf,designs){
 for(let u=start,i=0;u<=end;u+=spacing,i++){
  const design=designs[i%designs.length];
  const [w,d,h,use,sign]=design;
  const [x,y]=offset(street,u,side*(roadHalf+d/2+(use==='wood-home'?18:14)));
  frontages.push({id:'front-'+id+'-'+i,x,y,w,d,h,use,sign,angle:street.angle+(side>0?Math.PI:0),style:i%3,
   theme:use.startsWith('wood')?'west':'east',seed:i*147+Math.round(u)});
 }
}
const woodShops=[
 [58,49,33,'wood-shop','八百屋 こはる'],[64,53,39,'wood-shop','坂の古本店'],
 [56,44,30,'wood-shop','のきさき茶房'],[62,52,37,'wood-shop','靴修理 つむぎ']
];
const woodHomes=[[55,48,35,'wood-home',''],[67,53,41,'wood-home',''],[52,44,28,'wood-home','']];
const eastStores=[[112,68,43,'avenue-store','光庭ベーカリー'],[107,64,48,'avenue-store','ミズキ書房'],[110,70,42,'avenue-store','花と暮らし']];
const eastFlats=[[109,76,119,'avenue-flat',''],[115,80,98,'avenue-flat',''],[105,77,133,'avenue-flat','']];

row('market',westMarket,1,88,690,74,22,woodShops);
row('market-homes',westMarket,-1,113,664,87,22,woodHomes);
row('garden-homes',westHouses,-1,94,645,76,22,woodHomes);
row('garden-shops',westHouses,1,98,625,103,22,[woodHomes[0],woodShops[2],woodHomes[1]]);
row('boulevard-plaza-side',eastAvenue,-1,94,235,128,36,eastStores);
row('boulevard-high-side',eastAvenue,1,112,676,139,36,eastFlats);
row('boulevard-corner',eastAvenue,-1,701,701,140,36,[eastFlats[1]]);
row('avenue-shops',eastShops,-1,118,820,136,36,eastStores);
row('avenue-flats',eastShops,1,136,790,153,36,eastFlats);

export const plaza={
 id:'kotei-plaza',name:'光庭広場',
 points:[[278,-54],[664,-54],[664,-260],[278,-260]].map(([u,v])=>offset(eastAvenue,u,v)),
 center:offset(eastAvenue,475,-156),
 angle:eastAvenue.angle,
};
export const streetProps=[
 ...Array.from({length:8},(_,i)=>({id:'market-lamp-'+i,position:offset(westMarket,100+i*81,31),type:'lantern'})),
 ...Array.from({length:5},(_,i)=>({id:'avenue-lamp-'+i,position:offset(eastAvenue,90+i*140,-47),type:'lamp'})),
 ...[[310,-153],[630,-153],[350,-228],[600,-228]].map(([u,v],i)=>({id:'plaza-bench-'+i,position:offset(eastAvenue,u,v),type:'bench'})),
 {id:'plaza-fountain',position:plaza.center,type:'fountain'}
];

export const pedestrianSites={
 chats:[158,310,466,614].map((u,i)=>({
  id:'shop-chat-'+i,
  points:[offset(westMarket,u-5,30),offset(westMarket,u+6,29)]
 })),
 plazaWalks:[
  [[330,-69],[625,-69],[645,-96],[615,-121],[550,-121],[413,-124],[346,-117],[326,-91]],
  [[365,-104],[554,-103],[590,-132],[588,-185],[557,-202],[415,-192],[375,-159]]
 ].map(path=>path.map(([u,v])=>offset(eastAvenue,u,v))),
 crossings:[
  {id:'market-zebra',street:westMarket,along:396,width:44,first:10,interval:24,person:3},
  {id:'plaza-zebra',street:eastAvenue,along:480,width:72,first:14,interval:31,person:4}
 ].map(({street,along,...crossing})=>({
  ...crossing,angle:street.angle,center:offset(street,along,0),
  ends:[offset(street,along,-crossing.width/2-12),offset(street,along,crossing.width/2+12)]
 }))
};
