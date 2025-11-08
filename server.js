// server.js
// Run: npm init -y
//      npm install express bcrypt cookie-parser body-parser
//      node server.js
// Open in browser: http://localhost:3000

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Path to store users
const USERS_FILE = path.join(__dirname, 'users.txt');
if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '', 'utf8');

// Middleware
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname)); // serve HTML/CSS/JS files

// Helper functions
function readUsers() {
  const raw = fs.readFileSync(USERS_FILE, 'utf8').trim();
  if(!raw) return [];
  return raw.split('\n').map(l => {
    try { return JSON.parse(l); } catch(e){ return null; }
  }).filter(u => u);
}
function writeUsers(arr){
  const lines = arr.map(u => JSON.stringify(u));
  fs.writeFileSync(USERS_FILE, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
}
function findUserByEmail(email){ return readUsers().find(u => u.email === email); }
function findUserByUsername(username){ return readUsers().find(u => u.username === username); }
function findUserByToken(token){ return readUsers().find(u => u.rememberToken === token); }

// Register
app.post('/api/register', async (req,res)=>{
  try{
    const {username,email,password} = req.body;
    if(!username || !email || !password) return res.json({ok:false,error:'Missing fields'});
    
    const users = readUsers();
    if(users.find(u=>u.email===email)) return res.json({ok:false,error:'Email already registered'});
    if(users.find(u=>u.username===username)) return res.json({ok:false,error:'Username already taken'});
    
    const hash = await bcrypt.hash(password,10);
    const user = { id: Date.now(), username, email, hash, createdAt:new Date().toISOString() };
    users.push(user);
    writeUsers(users);
    return res.json({ok:true});
  }catch(e){ console.error(e); return res.json({ok:false,error:'Server error'});}
});

// Login
app.post('/api/login', async (req,res)=>{
  try{
    const {emailOrUser,password,remember} = req.body;
    if(!emailOrUser || !password) return res.json({ok:false,error:'Missing fields'});
    
    const users = readUsers();
    const user = users.find(u=>u.email===emailOrUser || u.username===emailOrUser);
    if(!user) return res.json({ok:false,error:'Invalid credentials'});
    
    const ok = await bcrypt.compare(password,user.hash);
    if(!ok) return res.json({ok:false,error:'Invalid credentials'});
    
    if(remember){
      const token = crypto.randomBytes(32).toString('hex');
      const updated = users.map(u=>{
        if(u.id===user.id){ u.rememberToken = token; u.tokenIssued = new Date().toISOString(); }
        return u;
      });
      writeUsers(updated);
      res.cookie('remember', token, { httpOnly:true, maxAge:30*24*3600*1000 });
    }
    return res.json({ok:true,user:{id:user.id,username:user.username,email:user.email}});
  }catch(e){ console.error(e); return res.json({ok:false,error:'Server error'});}
});

// Auto-login via cookie
app.get('/api/auto-login', (req,res)=>{
  try{
    const token = req.cookies.remember;
    if(!token) return res.json({ok:false});
    const user = findUserByToken(token);
    if(!user) return res.json({ok:false});
    return res.json({ok:true,user:{id:user.id,username:user.username,email:user.email}});
  }catch(e){ console.error(e); return res.json({ok:false});}
});

// Logout
app.post('/api/logout',(req,res)=>{
  try{
    const token = req.cookies.remember;
    if(token){
      const users = readUsers();
      const updated = users.map(u=>{
        if(u.rememberToken === token){ delete u.rememberToken; delete u.tokenIssued; }
        return u;
      });
      writeUsers(updated);
      res.clearCookie('remember');
    }
    return res.json({ok:true});
  }catch(e){ console.error(e); return res.json({ok:false});}
});

// Simple admin view (for localhost only)
app.get('/api/admin/users',(req,res)=>{
  try{
    const ip = req.ip || req.connection.remoteAddress || '';
    if(!ip.includes('127.0.0.1') && !ip.includes('::1') && req.headers['x-forwarded-for'] !== '127.0.0.1') return res.json({ok:false,error:'Not allowed'});
    const users = readUsers();
    return res.json({ok:true,users});
  }catch(e){ console.error(e); return res.json({ok:false,error:'Server error'});}
});

app.listen(PORT,()=>{console.log(`Server running on http://localhost:${PORT}`);});