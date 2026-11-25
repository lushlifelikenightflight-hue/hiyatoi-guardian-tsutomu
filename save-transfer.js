import {decodeSave,encodeSave} from './physics.js?v=5.3.0';
export const saveFileLimit=2*1024*1024;
export function makeTransfer(state,best=null){return JSON.stringify({format:'tsutomu-save',formatVersion:1,save:JSON.parse(encodeSave(state)),best},null,2);}
export function parseTransfer(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>saveFileLimit)throw Error('2MB以下のセーブファイルを選んでください。');
 let value;try{value=JSON.parse(text);}catch{throw Error('セーブファイルを読み取れません。');}
 const wrapped=value?.format==='tsutomu-save';if(wrapped&&value.formatVersion!==1)throw Error('未対応のセーブ形式です。');
 const raw=JSON.stringify(wrapped?value.save:value),save=decodeSave(raw);if(!save)throw Error('このゲームの有効なセーブではありません。');
 const best=wrapped?value.best:null;if(best!==null&&(!Number.isFinite(best)||best<=0||best>1e7))throw Error('記録の値が正しくありません。');
 return {raw,save,best};
}
export function applyTransfer(storage,key,candidate){
 // A validated backup must succeed before the current save can be replaced.
 const old=storage.getItem(key),previousBest=storage.getItem(key+'-park-record');
 if(old!==null)storage.setItem(key+'-before-import',old);
 try{storage.setItem(key,candidate.raw);if(candidate.best!==null)storage.setItem(key+'-park-record',String(candidate.best));else storage.removeItem(key+'-park-record');}
 catch(error){if(old!==null)storage.setItem(key,old);else storage.removeItem(key);if(previousBest!==null)storage.setItem(key+'-park-record',previousBest);else storage.removeItem(key+'-park-record');throw error;}
}
export function mountSaveTransfer({state,key,getBest,onOpen,onClose,onReplacing}){
 const root=document.createElement('div');root.id='save-transfer';root.className='overlay release-overlay';root.hidden=true;
 root.innerHTML='<section class="menu-dialog" role="dialog" aria-modal="true" aria-labelledby="transfer-title"><div class="dialog-head"><h2 id="transfer-title">セーブ移行</h2><button type="button" id="transfer-close">閉じる</button></div><p>Sites版で書き出し、新しいURLで読み込むと続きから遊べます。</p><button type="button" id="transfer-export">セーブを書き出す</button><label class="transfer-file">セーブファイルを選ぶ<input id="transfer-file" type="file" accept=".json,application/json"></label><p id="transfer-status" role="status" aria-live="polite"></p><button type="button" id="transfer-commit" disabled>このセーブで再開する</button><small>読み込み前の進行は、このブラウザー内にバックアップします。</small></section>';
 document.getElementById('game').append(root);const find=id=>root.querySelector('#'+id),status=find('transfer-status'),commit=find('transfer-commit');let candidate=null,focus=null;
 function close(){root.hidden=true;onClose();focus?.focus();}
 find('transfer-close').onclick=close;
 find('transfer-export').onclick=()=>{const blob=new Blob([makeTransfer(state,getBest())],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='日雇いガーディアンつとむ-セーブ.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='書き出しました。移植先でも「セーブ移行」から読み込めます。';};
 find('transfer-file').onchange=async event=>{candidate=null;commit.disabled=true;const file=event.target.files?.[0];if(!file)return;try{if(file.size>saveFileLimit)throw Error('2MB以下のセーブファイルを選んでください。');candidate=parseTransfer(await file.text());status.textContent=candidate.save.hero.day+'日目 / '+candidate.save.points.toLocaleString('ja-JP')+' pt。この内容で現在の進行を置き換えます。';commit.disabled=false;}catch(e){status.textContent=e.message;}};
 commit.onclick=()=>{if(!candidate)return;onReplacing(true);try{applyTransfer(localStorage,key,candidate);location.reload();}catch{onReplacing(false);status.textContent='保存できませんでした。空き容量とブラウザーの保存設定を確認してください。';}};
 root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key!=='Tab')return;const items=[...root.querySelectorAll('button,input')].filter(n=>!n.disabled),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 const open=()=>{focus=document.activeElement;candidate=null;commit.disabled=true;status.textContent='';find('transfer-file').value='';onOpen();root.hidden=false;find('transfer-close').focus();};
 for(const [parent,label] of [[document.querySelector('#intro .intro-bottom'),'セーブ移行'],[document.querySelector('#menu .menu-dialog'),'セーブの書き出し・読み込み']]){if(!parent)continue;const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=open;parent.append(b);}return {open};
}
