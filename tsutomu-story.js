export const gameTitle='日雇いガーディアンつとむ';
export const introduction=[
 {title:'はじめまして、オペレーターくん',text:'やぁ。きみが新しく派遣されてきた監視オペレーターくんかい？\nぼくはつとむ。この街をまもるヒーローみたいなものさ。'},
 {title:'いつものぼく',text:'普段は市民たちの生活に溶け込み日雇い労働をして金を稼ぎ、\n街がピンチのときはヒーローとして活躍するのさ。\nきみはそんなぼくの相棒ってわけ。'},
 {title:'きみのだいじな仕事',text:'これからきみにはぼくの行動を指示してもらう。\n何の仕事をして、どうやって街を守っていくかを考えてもらうだいじな仕事だよ。'},
 {title:'ぼくたちの稼ぎで',text:'そこで得たお金でマシンや武器の整備をしていくからちゃんとやってね。\nそれじゃさっそくやってみよう！'},
 {title:'仕事をはじめよう',text:'W・A・S・Dか矢印キーで運転、Spaceでブレーキ。画面の運転ボタンでも動かせるよ。\nタクシー・バス・配送バン・ブルドーザー・消防車・救急車に乗ったら、仕事ボタンかJで勤務開始。完了すると次の依頼へ。Jでもう一度押せば、いつでもやめられるよ。'},
 {title:'マシンと武器の準備',text:'稼ぎは画面にポイントで表示される。速く、車体を傷つけずに仕事を終えれば高ランクだ。\n地図のGは街の4店舗のガレージ。中で停車すると購入・強化画面が開くよ。Hでアジトへ案内、Mで地図だよ。'},
 {title:'街がピンチになったら',text:'1日は8分。メニューや地図、この説明の間は時間が止まるよ。\n準備が進むと山や海から怪獣がやってくる。警告が出たら大きな矢印と道路の案内を追って現場へ！ 武器を装備した車でXか攻撃ボタンを長押し。踏みつけの予兆の輪からは離れよう。'},
 {title:'暮らしを守るということ',text:'建物が壊れたり人に被害が出たりすると、街の人口が減るんだ。ぼくたちの運転や武器でも被害が出るから気をつけて。\n建物は時間がたつと少しずつ再建され、人口も戻ってくるよ。アジトでは翌朝まで休めるけど、怪獣がいる間は休めないんだ。'},
 {title:'そうだそうだ、街の税収',text:'そうだそうだ。１週間おきに市民から税をまきあげてるんだけど、\n人口１人につき１ポイント吸い上げるシステムだから、\nあんまり減らさないようにがんばってね。\n\n7日経過ごとに、そのときの人口と同じポイントが入るよ。最初は8日目の朝だ。'}
];
// Keep the original meeting separate from the gradually unlocked driving lessons.
export const meeting=introduction.slice(0,4);
export function raidMessage(monster){return [{title:monster.phase==='approaching'?'緊急指令 / 怪獣接近':'緊急指令 / 怪獣出現',text:(monster.kind?'海側から潮甲獣アオナギ':'山側から岩角獣ガンロウ')+(monster.phase==='approaching'?'が接近中！ まだ街の外だ。':'が現れた！')+'\nオペレーターくん、武装したマシンで迎え撃つ指示を頼むよ。大きな矢印が怪獣の方角だ。\n踏みつけ、爪、光線に隕石まで使ってくるぞ。地面の予兆から離れて、市民と街を守ろう！'}];}

export function mountNarration({onClose}){
 const root=document.getElementById('narration-panel'),next=document.getElementById('narration-next');let pages=[],index=0,kind=null;
 function render(){const p=pages[index];document.getElementById('narration-heading').textContent='つとむ：'+p.title;document.getElementById('narration-text').textContent=p.text;document.getElementById('narration-page').textContent=kind==='intro'?(index+1)+' / '+pages.length:kind==='vehicle'?'新しい乗り物':kind==='tutorial'?'相棒のひとこと':'街を守るヒーロー';next.textContent=index<pages.length-1?'次へ':kind==='raid'?'現場へ向かう':kind==='vehicle'?'仕事に出よう':kind==='tutorial'?'やってみる':'指示をはじめる';next.focus({preventScroll:true});}
 function close(){if(!kind)return;const finished=kind;kind=null;root.hidden=true;onClose(finished);}
 next.addEventListener('click',()=>{if(!kind)return;if(index<pages.length-1){index++;render();}else close();});
 // Space belongs to driving, never to advancing a conversation. Also cancel
 // keyup when a conversation appeared between pressing and releasing the brake.
 for(const type of ['keydown','keyup'])next.addEventListener(type,e=>{if(e.key===' '||(type==='keydown'&&e.repeat&&e.key==='Enter'))e.preventDefault();});
 root.addEventListener('keydown',e=>{if(e.key==='Tab'){const first=next,last=next;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 return {open(type,script){kind=type;pages=script;index=0;root.hidden=false;render();},close,get kind(){return kind;}};
}
