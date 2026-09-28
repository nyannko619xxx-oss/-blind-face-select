// Presentation only. Ranking is already decided by the player's choices.
export const BOARD_POSITIONS=[9,8,7,3,1,2,6,5,4];
const safeImage=value=>{try{return new URL(value).protocol==='https:'}catch{return false}};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const closingBeat={3:{before:110,after:250},2:{before:190,after:340},1:{before:350,after:570}};
export function createRevealBoard(host,ordered,{onDetail=()=>{},onProgress=()=>{},onComplete=()=>{}}={}){
  if(!Array.isArray(ordered)||ordered.length!==9)throw Error('TOP9が必要です');
  host.replaceChildren();host.classList.remove('is-final');
  const cards=new Map();let next=0,finished=false,stopped=false;
  for(const rank of BOARD_POSITIONS){
    const button=document.createElement('button');button.type='button';button.className='board-card';button.dataset.rank=String(rank);
    button.disabled=true;button.setAttribute('aria-label',`${rank}位 未公開`);
    const number=document.createElement('span');number.className='board-number';number.textContent=`${rank}位`;
    const photo=document.createElement('span');photo.className='board-photo';
    const caption=document.createElement('span');caption.className='board-caption';
    const veil=document.createElement('span');veil.className='board-veil';veil.setAttribute('aria-hidden','true');
    button.append(photo,number,caption,veil);
    button.onclick=async()=>{
      if(stopped)return;
      if(button.classList.contains('is-revealed')){onDetail(rank,ordered[rank-1]);return}
      if(rank!==next)return;
      next=0;button.disabled=true;
      const beat=window.matchMedia('(prefers-reduced-motion: reduce)').matches?null:closingBeat[rank];
      if(beat)await pause(beat.before);
      if(stopped)return;
      unveil(rank);button.disabled=true;
      try{await onProgress(rank,ordered[rank-1])}catch{host.dataset.saveError='true';return}
      if(beat)await pause(beat.after);
      if(stopped)return;
      button.disabled=false;
      if(rank===1)complete();else arm(rank-1);
    };
    host.append(button);cards.set(rank,{button,photo,caption});
  }
  function unveil(rank){
    const c=ordered[rank-1],{button,photo,caption}=cards.get(rank);
    if(button.classList.contains('is-revealed'))return;
    if(safeImage(c?.imageUrl)){
      const img=document.createElement('img');img.alt='';img.referrerPolicy='no-referrer';img.src=c.imageUrl;
      img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('span'),{className:'board-missing',textContent:'画像を表示できません'}))};
      photo.append(img);
    }else photo.append(Object.assign(document.createElement('span'),{className:'board-missing',textContent:'画像なし'}));
    caption.textContent=c?.name||'候補';button.disabled=false;
    button.setAttribute('aria-label',`${rank}位 ${caption.textContent} 詳細を開く`);
    button.classList.add('is-revealed');button.classList.remove('is-next');
    if(rank<=3)button.classList.add('is-emphasized');
  }
  function arm(rank){
    next=rank;host.dataset.nextRank=String(rank);
    const button=cards.get(rank).button;button.disabled=false;button.classList.add('is-next');
    button.setAttribute('aria-label',`${rank}位を公開`);
  }
  function complete(emit=true){
    if(finished)return;finished=true;next=0;delete host.dataset.nextRank;
    host.classList.add('is-final');if(emit)onComplete();
  }
  function startManual(revealedCount=0){
    if(!Number.isInteger(revealedCount)||revealedCount<0||revealedCount>9)throw Error('Reveal進行状態が不正です');
    stopped=false;
    for(let i=0;i<revealedCount;i++)unveil(9-i);
    if(revealedCount===9)complete(false);else arm(9-revealedCount);
  }
  function showAll(){stopped=false;for(let rank=9;rank>=1;rank--)unveil(rank);complete(false)}
  return {startManual,play:startManual,showAll,skip:showAll,stop(){stopped=true},get finished(){return finished}};
}
