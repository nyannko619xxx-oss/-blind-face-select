// Presentation only. The ordered input is an already decided rank 1–9.
export const BOARD_POSITIONS=[9,8,7,3,1,2,6,5,4];
const dwell={9:620,8:620,7:620,6:620,5:620,4:620,3:800,2:900,1:1350};
const safeImage=value=>{try{return new URL(value).protocol==='https:'}catch{return false}};

export function createRevealBoard(host, ordered, {onDetail=()=>{},onProgress=()=>{},onComplete=()=>{}}={}) {
  if (!Array.isArray(ordered)||ordered.length!==9) throw Error('TOP9が必要です');
  host.replaceChildren();host.classList.remove('is-final');
  const cards=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let token=0,finished=false;
  for(const rank of BOARD_POSITIONS){
    const button=document.createElement('button');button.type='button';button.className='board-card';button.dataset.rank=String(rank);
    button.disabled=true;button.setAttribute('aria-label',`${rank}位 未公開`);
    const number=document.createElement('span');number.className='board-number';number.textContent=`${rank}位`;
    const photo=document.createElement('span');photo.className='board-photo';
    const caption=document.createElement('span');caption.className='board-caption';
    const veil=document.createElement('span');veil.className='board-veil';veil.setAttribute('aria-hidden','true');
    button.append(photo,number,caption,veil);
    button.onclick=()=>{if(button.classList.contains('is-revealed'))onDetail(rank,ordered[rank-1])};
    host.append(button);cards.set(rank,{button,photo,caption});
  }
  function unveil(rank){
    const c=ordered[rank-1],{button,photo,caption}=cards.get(rank);
    if(button.classList.contains('is-revealed'))return;
    if(safeImage(c?.imageUrl)){
      const img=document.createElement('img');img.alt='';img.src=c.imageUrl;
      img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('span'),{className:'board-missing',textContent:'画像を表示できません'}))};
      photo.append(img);
    }else photo.append(Object.assign(document.createElement('span'),{className:'board-missing',textContent:'画像なし'}));
    caption.textContent=c?.name||'架空候補';button.disabled=false;
    button.setAttribute('aria-label',`${rank}位 ${caption.textContent} 詳細を開く`);
    button.classList.add('is-revealed');
    if(rank<=3)button.classList.add('is-emphasized');
    onProgress(rank,c);
  }
  function complete(){if(finished)return;finished=true;host.classList.add('is-final');onComplete()}
  function showAll(){token++;for(let rank=9;rank>=1;rank--)unveil(rank);complete()}
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function play(){
    token++;const run=token;finished=false;host.classList.remove('is-final');
    await wait(reduced?20:260);
    for(let rank=9;rank>=1;rank--){
      if(run!==token)return;
      if(rank===1){await wait(reduced?25:360);if(run!==token)return}
      unveil(rank);
      await wait(reduced?65:dwell[rank]+(rank===1?0:125));
    }
    if(run===token)complete();
  }
  return {play,showAll,skip:showAll,stop(){token++},get finished(){return finished}};
}
