const SUPABASE_URL='https://wqfuovvebgipiowaarbo.supabase.co';
const TOKEN_KEY='alfhd_secure_session_token';
const LEGACY_KEY='alfhd_session';
const PIN_KEY='alfhd_pending_login_pin';

function getToken(){return localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY)||''}
function normalizeDigits(value=''){
  return String(value)
    .replace(/[\u0660-\u0669]/g,d=>String(d.charCodeAt(0)-0x0660))
    .replace(/[\u06F0-\u06F9]/g,d=>String(d.charCodeAt(0)-0x06F0));
}
function getLegacy(){
  try{return JSON.parse(localStorage.getItem(LEGACY_KEY)||sessionStorage.getItem(LEGACY_KEY)||'null')}catch(_e){return null}
}
function chosenStorage(){return localStorage.getItem(LEGACY_KEY)?localStorage:sessionStorage}

async function createSecureSession(code, remember=true){
  const normalized=normalizeDigits(code).replace(/\D/g,'').slice(0,4);
  if(!/^\d{4}$/.test(normalized)) return false;
  const r=await fetch('/api/secure-login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({code:normalized,remember})
  });
  const x=await r.json().catch(()=>null);
  if(!r.ok||x?.status!=='ok'||!x?.token) return false;
  const store=remember?localStorage:sessionStorage;
  localStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(TOKEN_KEY);
  store.setItem(TOKEN_KEY,x.token);
  sessionStorage.removeItem(PIN_KEY);
  return true;
}

export function installSecureSessionBridge(){
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.startsWith(SUPABASE_URL)){
      const token=getToken();
      if(token){
        const h=new Headers(init.headers||(typeof input!=='string'?input.headers:undefined)||{});
        const current=h.get('x-client-info')||'alfhd-web';
        h.set('x-client-info',`${current};alfhd-session:${token}`);
        init={...init,headers:h};
      }
    }
    return originalFetch(input,init);
  };

  document.addEventListener('input',(e)=>{
    const el=e.target;
    if(!(el instanceof HTMLInputElement))return;
    const label=(el.getAttribute('aria-label')||'').toLowerCase();
    if(label.includes('رمز الدخول')||el.inputMode==='numeric'){
      const pin=normalizeDigits(el.value).replace(/\D/g,'').slice(0,4);
      if(pin)sessionStorage.setItem(PIN_KEY,pin);
    }
  },true);

  document.addEventListener('click',(e)=>{
    const t=e.target?.closest?.('button');
    if(!t)return;
    const txt=(t.textContent||'').trim();
    if(/^\d$/.test(txt)){
      const cur=sessionStorage.getItem(PIN_KEY)||'';
      sessionStorage.setItem(PIN_KEY,(cur+txt).slice(-4));
    } else if(txt==='مسح') sessionStorage.removeItem(PIN_KEY);
    else if(txt==='⌫') sessionStorage.setItem(PIN_KEY,(sessionStorage.getItem(PIN_KEY)||'').slice(0,-1));
  },true);

  const proto=Storage.prototype;
  const originalSet=proto.setItem;
  proto.setItem=function(key,value){
    originalSet.call(this,key,value);
    if(key===LEGACY_KEY&&!getToken()){
      const pin=sessionStorage.getItem(PIN_KEY)||'';
      const remember=this===localStorage;
      queueMicrotask(async()=>{
        try{
          const ok=await createSecureSession(pin,remember);
          if(ok) location.reload();
        }catch(e){ console.error('secure session bootstrap failed',e); }
      });
    }
  };

  const legacy=getLegacy();
  if(legacy&&!getToken()){
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
  }
}
