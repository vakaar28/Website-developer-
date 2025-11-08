async function postJson(url, data){
  const res = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  });
  return await res.json();
}
function qs(sel){return document.querySelector(sel)}

const loginForm=qs('#login-form');
const registerForm=qs('#register-form');
const switchLink=qs('#switch-link');
const formTitle=qs('#form-title');
const msg=qs('#msg');
const authBox=qs('#auth-box');
const dashboard=qs('#dashboard');
const userNameSpan=qs('#user-name');
const logoutBtn=qs('#logout');
const viewUsersBtn=qs('#view-users');
const adminOut=qs('#admin-output');
const showPass=qs('#show-pass');
const showPassReg=qs('#show-pass-reg');

// show/hide password
showPass.addEventListener('click',()=>{const p=qs('#password');p.type=p.type==='password'?'text':'password'})
showPassReg.addEventListener('click',()=>{const p=qs('#reg-password');p.type=p.type==='password'?'text':'password'})

// switch to register
switchLink.addEventListener('click',(e)=>{
  e.preventDefault();
  formTitle.textContent='Register';
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  document.querySelector('#switch-line').innerHTML='Already have account? <a href="#" id="switch-link2">Login</a>';
  document.querySelector('#switch-link2').addEventListener('click',(ev)=>{ev.preventDefault();location.reload();});
});

// register
registerForm.addEventListener('submit',async e=>{
  e.preventDefault();
  msg.textContent='';
  const username=qs('#reg-username').value.trim();
  const email=qs('#reg-email').value.trim();
  const password=qs('#reg-password').value;
  const res=await postJson('/api/register',{username,email,password});
  if(!res.ok){msg.style.color='#ffdede';msg.textContent=res.error||'Error';return;}
  msg.style.color='#cfe5ff';msg.textContent='Registered! Redirecting to login...';
  setTimeout(()=>location.reload(),900);
});

// login
loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  msg.textContent='';
  const emailOrUser=qs('#emailOrUser').value.trim();
  const password=qs('#password').value;
  const remember=qs('#remember').checked;
  const res=await postJson('/api/login',{emailOrUser,password,remember});
  if(!res.ok){msg.style.color='#ffdede';msg.textContent=res.error||'Login failed';return;}
  showDashboard(res.user);
});

function showDashboard(user){
  authBox.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userNameSpan.textContent=user.username||user.email;
  msg.textContent='';
}

// logout
logoutBtn.addEventListener('click',async ()=>{
  await postJson('/api/logout',{});
  location.reload();
});

// view users (admin)
viewUsersBtn.addEventListener('click',async ()=>{
  try{
    const res=await fetch('/api/admin/users');
    const j=await res.json();
    if(j.ok){
      adminOut.classList.toggle('hidden');
      adminOut.textContent=JSON.stringify(j.users,null,2);
    }else alert('Not allowed');
  }catch(e){console.error(e)}
});

// auto-login
(async function(){
  try{
    const res=await fetch('/api/auto-login');
    const j=await res.json();
    if(j.ok) showDashboard(j.user);
  }catch(e){}
})();