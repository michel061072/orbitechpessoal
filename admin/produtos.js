async function carregarProdutos() {
  const resp = await fetch('/api/admin/products');

  if (resp.status === 401) {
    window.location.href = '/admin';
    return;
  }

  const produtos = await resp.json();
  const lista = document.getElementById('listaProdutosAdmin');

  lista.innerHTML = produtos.map(p => `
    <div class="pedido">
      <img src="/${p.imagem}" style="width:80px;height:80px;object-fit:cover;border-radius:10px">

      <h3>${p.nome}</h3>
      <p>Categoria: ${p.categoria}</p>
      <p>Preço: R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</p>
      <p>Imagem: ${p.imagem}</p>

      <button onclick='editarProduto(${JSON.stringify(p)})'>Editar</button>
      <button onclick="removerProduto(${p.id})">Remover</button>
    </div>
  `).join('');
}

function editarProduto(p) {
  document.getElementById('produtoId').value = p.id;
  document.getElementById('nome').value = p.nome;
  document.getElementById('categoria').value = p.categoria;
  document.getElementById('preco').value = p.preco;
}

function limparFormulario() {
  document.getElementById('produtoId').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('preco').value = '';
  document.getElementById('imagemArquivo').value = '';
}

async function salvarProduto() {
  const id = document.getElementById('produtoId').value;

  const produto = {
    nome: document.getElementById('nome').value,
    categoria: document.getElementById('categoria').value,
    preco: document.getElementById('preco').value,
    imagem: ''
  };

  const arquivo = document.getElementById('imagemArquivo').files[0];

  if (!arquivo && !id) {
    alert('Escolha uma imagem para o produto.');
    return;
  }

  if (arquivo) {
    const formData = new FormData();
    formData.append('imagem', arquivo);

    const uploadResp = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const uploadData = await uploadResp.json();

    if (!uploadResp.ok) {
      alert(uploadData.erro || 'Erro ao enviar imagem');
      return;
    }

    produto.imagem = uploadData.caminho;
  }

  const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
  const metodo = id ? 'PUT' : 'POST';

  const resp = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(produto)
  });

  const dados = await resp.json();

  if (!resp.ok) {
    alert(dados.erro || 'Erro ao salvar produto');
    return;
  }

  limparFormulario();
  carregarProdutos();
}

async function removerProduto(id) {
  if (!confirm('Tem certeza que deseja remover este produto?')) return;

  await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE'
  });

  carregarProdutos();
}

carregarProdutos();