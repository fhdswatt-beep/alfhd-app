const SUPABASE_URL='https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
const TOKEN_KEY='alfhd_secure_session_token';
const LEGACY_KEY='alfhd_session';

function storage(){return localStorage.getItem(LEGACY_KEY)?localStorage:sessionStorage}
function getToken(){return localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY)||''}

export function installSecureSessionBridge(){
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.startsWith(SUPABASE_URL)){
      const token=getToken();
      if(token){
        const h=new Headers(init.headers||(typeof input!=='string'?input.headers:undefined)||{});
        h.set('x-alfhd-session',token);
        init={...init,headers:h};
      }
    }
    return originalFetch(input,init);
  };

  const legacy=localStorage.getItem(LEGACY_KEY)||sessionStorage.getItem(LEGACY_KEY);
  if(legacy&&!getToken()) queueMicrotask(showSecureRelogin);
}

function showSecureRelogin(){
  if(document.getElementById('alfhd-secure-relogin'))return;
  const wrap=document.createElement('div');
  wrap.id='alfhd-secure-relogin';
  wrap.dir='rtl';
  wrap.innerHTML=`<div class="asr-card"><div class="asr-logo">ف</div><h2>تأكيد الدخول</h2><p>صار تحديث أمان على النظام. أدخل رمز الدخول مرة وحدة حتى ترجع المحادثات والبيانات المحمية.</p><input id="asr-code" inputmode="numeric" maxlength="4" placeholder="رمز الدخول"/><button id="asr-go">دخول</button><small id="asr-msg"></small></div>`;
  const style=document.createElement('style');
  style.textContent=`#alfhd-secure-relogin{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(5,5,9,.88);backdrop-filter:blur(18px);font-family:Cairo,sans-serif}.asr-card{width:min(92vw,380px);padding:28px;border:1px solid rgba(255,255,255,.09);border-radius:26px;background:linear-gradient(150deg,#1a1822,#0f0f14);color:#fff;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.55)}.asr-logo{width:56px;height:56px;margin:0 auto 14px;border-radius:18px;display:grid;place-items:center;font-size:24px;font-weight:900;background:linear-gradient(145deg,#9b68ff,#5d39d6)}.asr-card h2{margin:6px 0}.asr-card p{color:#aaa5b4;font-size:13px;line-height:1.8}.asr-card input{width:100%;height:52px;margin:14px 0 10px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:#17171e;color:#fff;text-align:center;font-size:22px;letter-spacing:.3em;outline:none}.asr-card button{width:100%;height:48px;border:0;border-radius:14px;background:linear-gradient(135deg,#9868ff,#6840e3);color:#fff;font-weight:900}.asr-card small{display:block;min-height:20px;margin-top:8px;color:#ff8f9b}`;
  document.head.appendChild(style);document.body.appendChild(wrap);
  const input=wrap.querySelector('#asr-code'),btn=wrap.querySelector('#asr-go'),msg=wrap.querySelector('#asr-msg');
  input.focus();
  const go=async()=>{const code=input.value.trim();if(!/^\d{4}$/.test(code)){msg.textContent='اكتب رمز من 4 أرقام';return}btn.disabled=true;msg.textContent='';try{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_alfhd_user`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_code:code,p_remember:true})});const x=await r.json();if(x?.status!=='ok'||!x?.token)throw new Error(x?.status||'login_failed');const st=storage();st.setItem(TOKEN_KEY,x.token);const u=x.user||{};st.setItem(LEGACY_KEY,JSON.stringify({userId:u.id,userData:{id:u.id,name:u.name,role:u.role,permissions:u.permissions||[],active:u.active,jobTitle:u.job_title||'',whatsapp:u.whatsapp||'',workspaceId:u.workspace_id??null}}));location.reload()}catch(e){msg.textContent=e?.message==='rate_limited'?'محاولات كثيرة، حاول بعد قليل':'رمز الدخول غير صحيح';btn.disabled=false}};
  btn.onclick=go;input.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
}
