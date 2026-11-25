const buttonSelector='button,[role="button"],summary';
export function guardedButton(target){return (target?.closest?target:target?.parentElement)?.closest?.(buttonSelector)??null;}
export function bindButtonGuards(root,win){
 const prevent=event=>{if(guardedButton(event.target))event.preventDefault();};
 // Delegation also protects labels, SVGs and buttons created after startup.
 for(const type of ['contextmenu','selectstart','dragstart','copy'])root.addEventListener(type,prevent,{capture:true});
 root.addEventListener('pointerdown',event=>{
  if(!guardedButton(event.target)||!['touch','pen'].includes(event.pointerType))return;
  event.preventDefault();
  const selection=win.getSelection?.();if(guardedButton(selection?.anchorNode))selection.removeAllRanges();
 },{capture:true,passive:false});
 root.addEventListener('selectionchange',()=>{
  const selection=win.getSelection?.();if(guardedButton(selection?.anchorNode))selection.removeAllRanges();
 });
}
