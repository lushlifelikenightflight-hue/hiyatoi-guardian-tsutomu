// Fictional neighbourhood anchors. World construction finds a clear curb on a public road.
export const busStopAnchors=[
 ['station-front','木漏れ日駅南口','station',2260,1390],
 ['kodama','こだま横丁','station',2110,690],
 ['park-north','風待ち公園北口','park',1443,2209],
 ['park-south','こなら林入口','park',1130,3540],
 ['pond-east','鏡羽池東口','park',3020,2510],
 ['west-shops','軒先商店街','west',-2170,2068],
 ['west-garden','西の並木広場','west',-1800,2780],
 ['west-north','西の住宅通り','west',-1900,400],
 ['east-plaza','光庭広場','east',4830,1530],
 ['east-orchard','果樹園通り','east',5200,3100],
 ['east-north','東の大通り北','east',4300,700],
 ['apricot','杏灯の市','market',-1583,4236],
 ['apricot-south','杏灯の市南口','market',-1500,4900],
 ['watergate','白波水門','water',1501,6406],
 ['canal','白波運河通り','water',1650,5700],
 ['hill-garden','花帆の丘庭園','hill',5208,5200],
 ['terminus','花帆駅前','terminus',5123,7070],
 ['terminus-west','花帆駅西口','terminus',4470,7240],
 ['farm-south','ひばり牧場南口','farm',-1800,7000],
 ['castle-road','宵影城参道','castle',-2500,6840]
].map(([id,name,area,x,y])=>({id:'bus-'+id,name,area,x,y}));
