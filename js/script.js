let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinhoOrbitech") || "[]");

function moeda(valor){ return Number(valor).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
function limparTexto(txt){ return String(txt || "").replace(/[<>]/g, "").trim(); }
function salvar(){ localStorage.setItem("carrinhoOrbitech", JSON.stringify(carrinho)); }

async function carregarProdutos(){
  try{
    const resp = await fetch('/api/products');
    produtos = await resp.json();
    if(window.CATEGORIA_PAGINA){ produtos = produtos.filter(p => p.categoria === window.CATEGORIA_PAGINA); }
    renderizarProdutos(); renderizarCarrinho();
  }catch(e){
    const lista = document.getElementById("listaProdutos");
    if(lista) lista.innerHTML = "<p>Erro ao carregar produtos. Abra o site pelo servidor: npm start</p>";
  }
}

function renderizarProdutos(){
  const lista = document.getElementById("listaProdutos"); if(!lista) return;
  const inputBusca = document.getElementById("busca");
  const busca = inputBusca ? inputBusca.value.toLowerCase().trim() : "";
  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca) || p.categoria.toLowerCase().includes(busca));
  if(filtrados.length === 0){ lista.innerHTML = "<p>Nenhum produto encontrado.</p>"; return; }
  lista.innerHTML = filtrados.map(p => `
    <div class="produto">
      <div class="produto-img"><img src="${p.imagem}" alt="${p.nome}"></div>
      <div class="produto-info">
        <span class="categoria">${p.categoria}</span><h3>${p.nome}</h3><span class="preco">${moeda(p.preco)}</span>
        <button onclick="adicionarCarrinho(${p.id})">Adicionar ao carrinho</button>
      </div>
    </div>`).join("");
}

function adicionarCarrinho(id){
  const produto = produtos.find(p => p.id === id); if(!produto) return;
  const item = carrinho.find(i => i.id === id);
  if(item){ item.qtd++; } else { carrinho.push({id: produto.id, nome: produto.nome, imagem: produto.imagem, preco: produto.preco, qtd:1}); }
  salvar(); renderizarCarrinho(); abrirCarrinho();
}
function renderizarCarrinho(){
  const div = document.getElementById("itensCarrinho"); if(!div) return;
  const total = carrinho.reduce((soma, item) => soma + Number(item.preco) * item.qtd, 0);
  const qtd = carrinho.reduce((soma, item) => soma + item.qtd, 0);
  document.getElementById("contador").innerText = qtd; document.getElementById("totalCarrinho").innerText = moeda(total);
  if(carrinho.length === 0){ div.innerHTML = "<p>Seu carrinho está vazio.</p>"; return; }
  div.innerHTML = carrinho.map(item => `
    <div class="item"><img src="${item.imagem}" alt="${item.nome}"><div><h4>${item.nome}</h4><span>${moeda(item.preco)}</span><div class="qtd"><button onclick="alterarQtd(${item.id}, -1)">-</button><strong>${item.qtd}</strong><button onclick="alterarQtd(${item.id}, 1)">+</button></div></div><button class="remover" onclick="removerItem(${item.id})">remover</button></div>`).join("");
}
function alterarQtd(id, valor){ const item = carrinho.find(i => i.id === id); if(!item) return; item.qtd += valor; if(item.qtd <= 0){ removerItem(id); return; } salvar(); renderizarCarrinho(); }
function removerItem(id){ carrinho = carrinho.filter(i => i.id !== id); salvar(); renderizarCarrinho(); }
function abrirCarrinho(){ document.getElementById("carrinho").classList.add("abrir"); document.getElementById("overlay").classList.add("show"); }
function fecharCarrinho(){ document.getElementById("carrinho").classList.remove("abrir"); document.getElementById("overlay").classList.remove("show"); }
function copiarPix(){ navigator.clipboard.writeText("31971009562").then(()=>alert("Chave PIX copiada!")).catch(()=>alert("Chave PIX: 31971009562")); }

async function finalizarPedido(){
  if(carrinho.length === 0){ alert("Adicione produtos ao carrinho."); return; }
  const nome = limparTexto(document.getElementById('clienteNome')?.value);
  const telefone = limparTexto(document.getElementById('clienteTelefone')?.value);
  const endereco = limparTexto(document.getElementById('clienteEndereco')?.value);
  if(nome.length < 3 || telefone.length < 8){ alert('Preencha seu nome e WhatsApp antes de finalizar.'); return; }
  const botao = document.querySelector('.finalizar'); botao.disabled = true; botao.innerText = 'Salvando pedido...';
  try{
    const resp = await fetch('/api/orders', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({cliente:{nome,telefone,endereco}, itens:carrinho.map(i=>({id:i.id,qtd:i.qtd}))})});
    const dados = await resp.json();
    if(!resp.ok) throw new Error(dados.erro || 'Erro ao salvar pedido');
    carrinho = []; salvar(); renderizarCarrinho(); fecharCarrinho();
    const msg = `Olá, Orbitech Variedades! Fiz o pedido ${dados.numero}. Total: ${moeda(dados.total)}. Vou enviar o comprovante PIX. Chave: 31971009562`;
    alert(`Pedido ${dados.numero} salvo com sucesso! Agora envie o comprovante no WhatsApp.`);
    window.open(`https://wa.me/5511952816070?text=${encodeURIComponent(msg)}`, '_blank');
  }catch(e){ alert(e.message); }
  finally{ botao.disabled = false; botao.innerText = 'Finalizar pedido seguro'; }
}
function toggleMenu(){ document.getElementById("menu").classList.toggle("menu-aberto"); }
carregarProdutos();
