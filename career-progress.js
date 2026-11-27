export const newCareer=()=>({medals:[],races:0,escapes:0,shellHits:0});
export function validCareer(p){return p===undefined||Boolean(p&&Array.isArray(p.medals)&&new Set(p.medals).size===p.medals.length&&p.medals.every(id=>medals.some(m=>m.id===id))&&['races','escapes','shellHits'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0&&p[k]<=1e8));}
const owned=s=>s.hero.owned.filter(Boolean).length,upgrades=s=>s.upgrades.flat().reduce((n,x)=>n+x,0);
export const medals=[
 ['first-drive','はじめの一歩','100m走る',100,s=>s.distance*.12],['town-runner','街の走り手','累計10km走る',10000,s=>s.distance*.12],
 ['first-job','日雇いデビュー','仕事を1件完了',1,s=>s.hero.jobCount],['worker','街の働き手','仕事を10件完了',10,s=>s.hero.jobCount],['veteran','日雇いの星','仕事を50件完了',50,s=>s.hero.jobCount],['master','働き者の勲章','仕事を100件完了',100,s=>s.hero.jobCount],
 ['rank-s','文句なしの仕事','仕事でSランクを取る',1,s=>s.hero.lastRank?.rank==='S'?1:0],['fleet','マシン収集家','乗り物を5種類所有',5,owned],['all-fleet','町の車庫王','全11種類の乗り物を所有',11,owned],
 ['tuner','愛車の相棒','車体を合計10回強化',10,upgrades],['armed','備えあれば','武器を1種類購入',1,s=>s.hero.weapons.length],['artillery','街守りの砲手','標準砲を怪獣に命中',1,s=>s.hero.career.shellHits],
 ['guardian','こもれびのヒーロー','怪獣を1体撃退',1,s=>s.hero.raids],['defender','防衛の達人','怪獣を5体撃退',5,s=>s.hero.raids],['legend','伝説の守り手','怪獣を15体撃退',15,s=>s.hero.raids],
 ['race','公園の風','タイムアタックを完走',1,s=>s.hero.career.races],['escape','路地の名手','パトカー追跡をクリア',1,s=>s.hero.career.escapes],
 ['mayor','街の舵取り','週の街づくりを5回選ぶ',5,s=>s.hero.city.history.length],['century','百日の日雇い','100日目を迎える',100,s=>s.hero.day],['prosperity','にぎわいの立役者','人口記録8000人に到達',8000,s=>s.hero.robot?.peakPopulation??0],
 ['robot','封印を解く者','デストロイキングを入手',1,s=>s.hero.owned[10]?1:0],['income','こもれびの稼ぎ頭','総収入100000ptに到達',100000,s=>s.hero.totalEarned]
].map(([id,name,description,target,value])=>({id,name,description,target,value}));
export function updateMedals(s){const p=s.hero.career,got=[];for(const m of medals)if(!p.medals.includes(m.id)&&m.value(s)>=m.target){p.medals.push(m.id);got.push(m);}return got;}
export const newTutorial=()=>({stage:0,elapsed:0,since:0});
export function validTutorial(t){return t===undefined||Boolean(t&&Number.isInteger(t.stage)&&t.stage>=0&&t.stage<=6&&Number.isFinite(t.elapsed)&&t.elapsed>=0&&t.elapsed<1e9&&Number.isFinite(t.since)&&t.since>=0&&t.since<=t.elapsed);}
export const lessons=[
 {title:'相棒、まずはひと回り',text:'よし、相棒。まずはアクセルと左右のハンドルで、近所を走ってみよう。\nW・A・S・Dでも画面のボタンでも動けるよ。'},
 {title:'止まれるのも腕のうち',text:'いい感じだね。曲がり角や人のそばではゆっくりいこう。\nSpaceはブレーキ。後退ボタンかSでバックもできる。地図はMか右上の地図ボタンだよ。'},
 {title:'さて、ひと稼ぎ',text:'ぼくは日雇いで暮らしている。スクーターなら出前、軽バンなら配達だ。\n「仕事を始める」かJで受けてみよう。道路の矢印を追えばお客さんや届け先へ行ける。やめたいときも同じボタンでいいよ。'},
 {title:'稼ぎはマシンに',text:'稼いだポイントで、マシンを買ったり強くしたりできるんだ。\n地図のGがガレージ。光る入口に入って止まってみて。乗り物が増えれば、できる仕事も増えるよ。'},
 {title:'ヒーローの準備もね',text:'この街には、ときどき山や海から怪獣が来るんだ。\n武器もガレージで買える。装甲車なら最初から砲が付いているよ。武装したらXか攻撃ボタンで試してみよう。街まで壊しすぎないでね。'},
 {title:'そのうち、街も育つ',text:'そうだそうだ。１週間おきに市民から税をまきあげてるんだけど、人口１人につき１ポイント吸い上げるシステムだから、あんまり減らさないようにがんばってね。\nそのとき街のこれからを３つから選んでほしい。勲章もメニューで見られるよ。じゃ、あとの働き方は相棒に任せる！'}
];
export function tutorialReady(s){const t=s.hero.tutorial;if(t.stage>=6||s.hero.monster)return false;if(t.stage===0)return Boolean(s.hero.introSeen);const since=t.elapsed-t.since;
 return [false,s.distance>=220||since>=25,s.distance>=550||since>=45,s.hero.jobCount>0||since>=100,s.hero.owned.filter(Boolean).length>2||s.hero.weapons.length>0||since>=90,since>=40][t.stage];}
export function finishLesson(s){const t=s.hero.tutorial;t.stage=Math.min(6,t.stage+1);t.since=t.elapsed;}
