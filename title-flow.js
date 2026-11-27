import {frontTransition} from './title-session.js?v=5.6.0';
export function mountTitleFlow({hasResume,hasRaw,onContinue,onNew,onGesture,onSound}){
 const $=id=>document.getElementById(id),video=$('opening-video'),opening=$('opening'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let phase='movie',ready=false,stallTimer,leaving=false,leaveTimer;
 const consumed=new Set();
 function render(){
  document.getElementById('game').dataset.frontPhase=phase;
  opening.hidden=phase!=='movie'&&!leaving;$('title-screen').hidden=phase!=='title';$('intro').hidden=phase!=='menu';$('new-game-confirm').hidden=phase!=='confirm';
  $('start-button').disabled=!ready||!hasResume();$('new-game-button').disabled=!ready;$('new-game-accept').disabled=!ready;
  $('front-status').textContent=!ready?'街を準備しています…':hasResume()?'':hasRaw()?'読み込めるセーブがありません。「セーブ移行」からファイルを確認できます。':'';
  if(phase!=='movie'){clearTimeout(stallTimer);video.pause();}
 }
 function finishFade(){clearTimeout(leaveTimer);leaving=false;opening.classList.remove('is-leaving');render();}
 function change(event){const before=phase;phase=frontTransition(phase,event);if(before==='movie'&&phase==='title'&&!reduced){leaving=true;opening.inert=true;opening.setAttribute('aria-hidden','true');opening.classList.add('is-leaving');leaveTimer=setTimeout(finishFade,800);}else if(phase!=='title'&&leaving)finishFade();render();if(before!==phase){if(phase==='title')$('title-activate').focus();if(phase==='menu')$(hasResume()?'start-button':'new-game-button').focus();if(phase==='confirm')$('new-game-cancel').focus();}}
 function skip(){if(phase!=='movie')return;change('skip');}
 $('opening-skip').onclick=()=>{onGesture();skip();};video.onended=()=>change('ended');video.onerror=()=>change('error');
 $('opening-sound').onclick=e=>{e.stopPropagation();onSound();};
 opening.addEventListener('click',e=>{if(e.target!==$('opening-skip')&&e.target!==$('opening-sound')){onGesture();skip();}});
 $('title-activate').onclick=()=>{onGesture();change('activate');};$('title-menu-back').onclick=()=>change('back');
 $('new-game-button').onclick=()=>{if(hasRaw())change('new-confirm');else playNew();};
 $('new-game-cancel').onclick=()=>change('cancel');$('new-game-accept').onclick=playNew;
 function playNew(){if(!ready)return;try{onNew();phase='playing';render();}catch{$('new-game-error').textContent='バックアップを保存できません。空き容量と保存設定を確認してください。';if(phase!=='confirm')$('front-status').textContent=$('new-game-error').textContent;}}
 $('start-button').onclick=()=>{if(ready&&hasResume()){onContinue();phase='playing';render();}};
 document.addEventListener('keydown',e=>{
  if(!['movie','title'].includes(phase)||e.target===$('opening-sound')&&['Enter',' '].includes(e.key)||e.repeat||e.ctrlKey||e.metaKey||e.altKey||['Tab','Shift','Control','Alt','Meta','Escape'].includes(e.key))return;
  e.preventDefault();e.stopImmediatePropagation();consumed.add(e.code);onGesture();change(phase==='movie'?'skip':'activate');
 },true);
 document.addEventListener('keyup',e=>{if(consumed.has(e.code)){consumed.delete(e.code);e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!['menu','confirm'].includes(phase)||!$('instructions-panel').hidden)return;const panel=phase==='confirm'?$('new-game-confirm'):$('intro'),items=[...panel.querySelectorAll('button,a,input')].filter(n=>!n.disabled&&!n.hidden&&n.offsetParent!==null);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 function playMovie(){if(phase!=='movie')return;video.play().catch(()=>change('error'));}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else playMovie();});
 video.addEventListener('playing',()=>clearTimeout(stallTimer));stallTimer=setTimeout(()=>{if(phase==='movie'&&video.readyState<2)change('error');},12000);
 render();if(reduced)skip();else playMovie();
 return {ready(){ready=true;render();},returnTitle(){phase=frontTransition('playing','return');render();$('title-activate').focus();},playing(){phase='playing';render();},refresh:render,get phase(){return phase;}};
}
