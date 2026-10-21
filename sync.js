// One public shared calculator. Only changed fields are merged in PostgreSQL.
const CLOUD_URL='https://osthjhoaxqauvcositjb.supabase.co/rest/v1';
const CLOUD_KEY='sb_publishable_uxLXGu_q1toR-V0LxAKNew_24SBnbgb';
let ready=false,saving=false,loading=false,revision=-1,timer;
let pending={},inflight={};
const status=document.getElementById('syncStatus');
const pendingKey='kalkulator-07-pending-v1';
try{const stored=JSON.parse(sessionStorage.getItem(pendingKey)||'{}');for(const [id,value] of Object.entries(stored)){if(document.getElementById(id)?.tagName==='INPUT'&&typeof value==='string')pending[id]=value}}catch{}
function persistPending(){try{sessionStorage.setItem(pendingKey,JSON.stringify({...inflight,...pending}))}catch{}}
function message(text,error=false){status.textContent=text;status.classList.toggle('syncError',error)}
function controls(enabled){document.querySelectorAll('input[id],#save,#reset').forEach(el=>el.disabled=!enabled)}
async function request(path,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetch(CLOUD_URL+path,{...options,cache:'no-store',signal:controller.signal,headers:{apikey:CLOUD_KEY,'Content-Type':'application/json',...options.headers}});if(!response.ok)throw new Error('HTTP '+response.status);return await response.json()}finally{clearTimeout(timeout)}
}
function applyCloud(row){
 if(!row||row.id!=='kalkulator-07'||!row.data||!Number.isSafeInteger(Number(row.revision)))throw new Error('Brak wspólnych danych');
 if(Number(row.revision)<revision)return;
 revision=Number(row.revision);
 for(const [id,value] of Object.entries(row.data)){
  const el=document.getElementById(id);
  if(el?.tagName==='INPUT'&&!(id in pending)&&!(id in inflight)&&el!==document.activeElement)el.value=String(value);
 }
 for(const [id,value] of Object.entries(pending)){const el=document.getElementById(id);if(el)el.value=value}
 calc();
}
function savedMessage(){message('Zapisano online • '+new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))}
async function loadCloud(){
 if(loading||saving)return;loading=true;
 try{
  const rows=await request('/calculator_state?id=eq.kalkulator-07&select=id,data,revision,updated_at');applyCloud(rows[0]);
  if(!ready){ready=true;controls(true);document.querySelectorAll('input.money').forEach(formatMoney);message('Wczytano wspólne dane online')}
  if(Object.keys(pending).length){message('Zmiany oczekują na zapis…');scheduleSave()}else if(status.classList.contains('syncError'))message('Połączono • wspólne dane aktualne');
 }catch(error){message(ready?'Brak połączenia — zmiany czekają na zapis. Ponowię automatycznie.':'Nie udało się wczytać danych online. Ponowię automatycznie.',true)}finally{loading=false}
}
function scheduleSave(){clearTimeout(timer);timer=setTimeout(saveCloud,700)}
async function saveCloud(){
 clearTimeout(timer);if(!ready){loadCloud();return}if(saving)return;
 if(!Object.keys(pending).length){loadCloud();return}
 saving=true;inflight=pending;pending={};persistPending();message('Zapisywanie online…');
 try{
  const rows=await request('/rpc/save_calculator',{method:'POST',body:JSON.stringify({patch:inflight}),keepalive:true});
  // Keep newer local keystrokes when the response for an earlier edit arrives.
  const sent=inflight;inflight={};
  try{applyCloud(rows[0])}catch(error){inflight=sent;throw error}
  persistPending();savedMessage();
 }catch(error){pending={...inflight,...pending};inflight={};persistPending();message('Nie zapisano online — ponowię automatycznie. Pozostaw stronę otwartą.',true)}
 finally{saving=false;if(Object.keys(pending).length){clearTimeout(timer);timer=setTimeout(saveCloud,status.classList.contains('syncError')?5000:700)}}
}
function changed(el){if(!ready||el.tagName!=='INPUT'||!el.id)return;pending[el.id]=el.value;persistPending();message('Niezapisane zmiany…');scheduleSave()}
document.addEventListener('input',event=>changed(event.target));
document.addEventListener('change',event=>changed(event.target));
document.getElementById('save').addEventListener('click',saveCloud);
document.getElementById('reset').addEventListener('click',()=>{
 if(!ready||!confirm('Przywrócić wartości domyślne dla wszystkich osób korzystających z kalkulatora?'))return;
 reset();document.querySelectorAll('input[id]').forEach(el=>pending[el.id]=el.value);persistPending();scheduleSave();message('Przywracanie wartości domyślnych online…');
});
window.addEventListener('online',()=>{if(ready)saveCloud();else loadCloud()});
window.addEventListener('beforeunload',event=>{if(saving||Object.keys(pending).length){event.preventDefault();event.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&ready)saveCloud();else if(document.visibilityState==='visible')loadCloud()});
controls(false);loadCloud();
setInterval(()=>{if(document.visibilityState==='visible')loadCloud()},5000);
