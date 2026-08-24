const SUPABASE_URL='https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
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

async function createSecureSession(code,remember=true){
  const normalized=normalizeDigits(code).replace(/\D/g,'').slice(0,4);
  if(!/^\d{4}$/.test(normalized)) throw new Error('invalid_pin_capture');

  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_alfhd_user`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${SUPABASE_KEY}`,
      'Content-Type':'application/json',
      Accept:'application/json'
    },
    body:JSON.stringify({p_code:normalized,p_remember:remember})
  });
  const raw=await r.text();
  let x=null;
  try{x=raw?JSON.parse(raw):null}catch(_e){}
  if(!r.ok) throw new Error(`secure_login_http_${r.status}:${raw.slice(0,180)}`);
  if(x?.status==='rate_limited') throw new Error('rate_limited');
  if(x?.status==='invalid_credentials') throw new Error('invalid_credentials');
  if(x?.status!=='ok'||!x?.token) throw new Error(`secure_login_bad_response:${raw.slice(0,180)}`);

  const store=remember?localStorage:sessionStorage;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  store.setItem(TOKEN_KEY,x.token);
  sessionStorage.removeItem(PIN_KEY);
  return true;
}

function forceCleanLogin(message){
  localStorage.removeItem(LEGACY_KEY);
  sessionStorage.removeItem(LEGACY_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PIN_KEY);
  if(message) sessionStorage.setItem('alfhd_login_bridge_error',message);
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
        if(!current.includes('alfhd-session:')) h.set('x-client-info',`${current};alfhd-session:${token}`);
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
      sessionStorage.setItem(PIN_KEY,(cur+txt).slice(0,4));
    }else if(txt==='مسح') sessionStorage.removeItem(PIN_KEY);
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
          await createSecureSession(pin,remember);
          location.reload();
        }catch(e){
          console.error('secure session bootstrap failed',e);
          forceCleanLogin(e?.message||'secure_login_failed');
          alert('تعذر إكمال تسجيل الدخول الآمن. أعد المحاولة مرة واحدة.');
          location.reload();
        }
      });
    }
  };

  const legacy=getLegacy();
  if(legacy&&!getToken()){
    forceCleanLogin('missing_secure_session');
  }
}
