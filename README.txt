ORBITECH VARIEDADES - VERSÃO COM PAINEL ADMIN

O que foi adicionado:
- Pedidos agora são salvos em data/orders.json.
- Painel secreto em /admin para ver e alterar status dos pedidos.
- Login de administrador.
- Preços são recalculados no servidor, então o cliente não consegue mudar o valor pelo navegador.
- Limite de tentativas no login.
- Dados do cliente: nome, WhatsApp e endereço/observação.

COMO RODAR NO COMPUTADOR:
1. Instale o Node.js.
2. Abra a pasta do projeto no terminal.
3. Rode: npm install
4. Copie .env.example e renomeie para .env
5. No arquivo .env, troque:
   ADMIN_USER=admin
   ADMIN_PASSWORD=coloque-uma-senha-forte
   SESSION_SECRET=um-texto-grande-aleatorio
6. Rode: npm start
7. Abra no navegador: http://localhost:3000
8. Painel admin: http://localhost:3000/admin

IMPORTANTE SOBRE SEGURANÇA:
- Não publique o arquivo .env.
- Não deixe a senha padrão.
- Para ficar seguro de verdade online, hospede em servidor Node.js com HTTPS.
- Não use só hospedagem estática comum, porque o painel e os pedidos precisam do servidor.

PIX configurado:
Chave: 31971009562
Recebedor: Jonatan Robert Dos Reis Lima
WhatsApp: (11) 95281-6070
