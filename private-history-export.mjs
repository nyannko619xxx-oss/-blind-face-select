import {STORAGE_KEY,availableSessions,projectSession} from './private-history-export-core.mjs';
const $=id=>document.getElementById(id);let rows=[];
function status(text){$('status').textContent=text}
try{
  const raw=localStorage.getItem(STORAGE_KEY);
  rows=availableSessions(raw?JSON.parse(raw):null);
  const select=$('sessions');select.replaceChildren();
  if(!rows.length){select.add(new Option('完了済みの実候補セッションがありません',''));status('同じiPad・同じSafariで、実候補セットの選考を完了してから開いてください。');}
  else{
    rows.forEach((row,i)=>{const s=row.session;select.add(new Option(`${new Date(s.completedAt).toLocaleString('ja-JP')}／${s.setId}／${s.setVersion}／${row.source==='archive'?'過去':'最新'}／${s.state.history.length}画面`,String(i)))});
    select.disabled=false;$('download').disabled=false;status(`${rows.length}件の完了Sessionを確認しました。保存するSessionを選択してください。`);
  }
}catch(error){status('端末内の履歴を読み取れませんでした：'+error.message)}
$('download').onclick=()=>{
  try{
    const row=rows[Number($('sessions').value)];if(!row)throw Error('Sessionを選択してください。');
    const data=projectSession(row),text=JSON.stringify(data,null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`bfs-private-history-${data.provenance.completed_at.slice(0,10)}-${data.selection_snapshot.set_id}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    status('JSONを保存しました。ダウンロード一覧または「ファイル」アプリで確認してください。');
  }catch(error){status('保存できませんでした：'+error.message)}
};
