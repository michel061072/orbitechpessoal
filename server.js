require('dotenv').config();
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'troque-essa-senha-agora';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const DATA = path.join(__dirname, 'data');
const productsFile = path.join(DATA, 'products.json');
const ordersFile = path.join(DATA, 'orders.json');
const sessions = new Map();

app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'30kb'}));
app.use(express.urlencoded({extended:false, limit:'30kb'}));
app.use(cookieParser());
app.use(rateLimit({windowMs:15*60*1000, max:300}));
app.use('/api/admin/login', rateLimit({windowMs:15*60*1000, max:8, message:{erro:'Muitas tentativas. Espere um pouco.'}}));
app.use(express.static(__dirname, {extensions:['html'], dotfiles:'ignore'}));

function clean(v){ return String(v || '').replace(/[<>]/g,'').trim().slice(0,250); }
async function readJson(file, fallback){ try{ return JSON.parse(await fs.readFile(file,'utf8')); }catch{ return fallback; } }
async function writeJson(file, data){ await fs.writeFile(file, JSON.stringify(data,null,2)); }
function sign(id){ return crypto.createHmac('sha256', SESSION_SECRET).update(id).digest('hex'); }
function makeToken(){ const id=crypto.randomBytes(24).toString('hex'); return `${id}.${sign(id)}`; }
function validToken(token){ if(!token || !token.includes('.')) return false; const [id,sig]=token.split('.'); return sig === sign(id) && sessions.has(id); }
function requireAdmin(req,res,next){ if(!validToken(req.cookies.orbitech_admin)) return res.status(401).json({erro:'Acesso negado'}); next(); }

app.get('/api/products', async (req,res)=> res.json(await readJson(productsFile, [])) );

app.post('/api/orders', async (req,res)=>{
  const cliente = req.body.cliente || {};
  const nome = clean(cliente.nome), telefone = clean(cliente.telefone), endereco = clean(cliente.endereco);
  if(nome.length < 3 || telefone.length < 8) return res.status(400).json({erro:'Nome e WhatsApp são obrigatórios.'});
  const produtos = await readJson(productsFile, []);
  const itensReq = Array.isArray(req.body.itens) ? req.body.itens : [];
  if(!itensReq.length) return res.status(400).json({erro:'Carrinho vazio.'});
  const itens = [];
  for(const item of itensReq){
    const id = Number(item.id); const qtd = Math.max(1, Math.min(50, Number(item.qtd)||1));
    const prod = produtos.find(p=>Number(p.id)===id);
    if(prod) itens.push({id:prod.id, nome:prod.nome, categoria:prod.categoria, preco:prod.preco, qtd, subtotal:Number((prod.preco*qtd).toFixed(2))});
  }
  if(!itens.length) return res.status(400).json({erro:'Produtos inválidos.'});
  const total = Number(itens.reduce((s,i)=>s+i.subtotal,0).toFixed(2));
  const orders = await readJson(ordersFile, []);
  const numero = 'ORB-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(orders.length+1).padStart(4,'0');
  const order = {numero, criadoEm:new Date().toISOString(), status:'Pendente', cliente:{nome,telefone,endereco}, itens,total};
  orders.unshift(order); await writeJson(ordersFile, orders);
  res.status(201).json({numero,total});
});

app.post('/api/admin/login', async (req,res)=>{
  const {usuario, senha} = req.body || {};
  const okUser = String(usuario||'') === ADMIN_USER;
  const okPass = await bcrypt.compare(String(senha||''), await bcrypt.hash(ADMIN_PASSWORD, 10));
  if(!okUser || !okPass) return res.status(401).json({erro:'Usuário ou senha incorretos.'});
  const token = makeToken(); const id = token.split('.')[0]; sessions.set(id, {created:Date.now()});
  res.cookie('orbitech_admin', token, {httpOnly:true, sameSite:'strict', secure:false, maxAge:1000*60*60*8});
  res.json({ok:true});
});
app.post('/api/admin/logout', requireAdmin, (req,res)=>{ const c=req.cookies.orbitech_admin; if(c) sessions.delete(c.split('.')[0]); res.clearCookie('orbitech_admin'); res.json({ok:true}); });
app.get('/api/admin/me', requireAdmin, (req,res)=>res.json({usuario:ADMIN_USER}));
app.get('/api/admin/orders', requireAdmin, async (req,res)=>res.json(await readJson(ordersFile, [])) );
app.patch('/api/admin/orders/:numero', requireAdmin, async (req,res)=>{
  const status = clean(req.body.status);
  const allowed = ['Pendente','Pago','Separando','Enviado','Cancelado'];
  if(!allowed.includes(status)) return res.status(400).json({erro:'Status inválido.'});
  const orders = await readJson(ordersFile, []);
  const o = orders.find(x=>x.numero===req.params.numero);
  if(!o) return res.status(404).json({erro:'Pedido não encontrado.'});
  o.status = status; o.atualizadoEm = new Date().toISOString(); await writeJson(ordersFile, orders);
  res.json(o);
});
app.listen(PORT, ()=>console.log(`Orbitech rodando em http://localhost:${PORT}`));
