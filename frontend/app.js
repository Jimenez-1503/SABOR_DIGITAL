// A URL base onde seu backend Node.js + Express está escutando
const API_URL = 'http://localhost:3000';

// ----------------------------------------------------
// 1. MAPEAMENTO DE ELEMENTOS DA TELA
// ----------------------------------------------------
const productsGrid = document.getElementById('products-grid');
const modal = document.getElementById('modal');
const btnNovoProduto = document.getElementById('btn-novo-produto');
const closeBtn = document.querySelector('.close-btn');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');

// Elementos de Login e Saudação
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const modalLogin = document.getElementById('modal-login');
const closeLoginBtn = document.getElementById('close-login-btn');
const loginForm = document.getElementById('login-form');
const userGreeting = document.getElementById('user-greeting');

// Elementos de Registro
const btnRegistrar = document.getElementById('btn-registrar');
const modalRegistrar = document.getElementById('modal-registrar');
const closeRegistrarBtn = document.getElementById('close-registrar-btn');
const registrarForm = document.getElementById('registrar-form');

// Variáveis de estado global (Token JWT, Papel e Nome)
let tokenJWT = localStorage.getItem('token') || null;
let usuarioPapel = localStorage.getItem('papel') || null;
let usuarioNome = localStorage.getItem('nome') || null;

// ----------------------------------------------------
// 2. INICIALIZAÇÃO E EVENTOS
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    carregarProdutos();
});

btnNovoProduto.addEventListener('click', () => abrirModal());

closeBtn.addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarProduto();
});

// ----------------------------------------------------
// EVENTOS DE LOGIN E REGISTRO
// ----------------------------------------------------
btnLogin.addEventListener('click', () => modalLogin.classList.remove('hidden'));
closeLoginBtn.addEventListener('click', () => modalLogin.classList.add('hidden'));
btnLogout.addEventListener('click', () => fazerLogout());

btnRegistrar.addEventListener('click', () => modalRegistrar.classList.remove('hidden'));
closeRegistrarBtn.addEventListener('click', () => modalRegistrar.classList.add('hidden'));

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await fazerLogin();
});

registrarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await fazerRegistro();
});

// ----------------------------------------------------
// 2.5 FUNÇÕES DE AUTENTICAÇÃO
// ----------------------------------------------------
function verificarLogin() {
    if (tokenJWT) {
        if (usuarioNome) {
            userGreeting.textContent = `Olá, ${usuarioNome}!`;
            userGreeting.classList.remove('hidden');
        }

        btnLogout.classList.remove('hidden');
        btnLogin.classList.add('hidden');
        btnRegistrar.classList.add('hidden');

        if (usuarioPapel === 'admin') {
            btnNovoProduto.classList.remove('hidden');
        } else {
            btnNovoProduto.classList.add('hidden');
        }
    } else {
        userGreeting.classList.add('hidden');
        btnNovoProduto.classList.add('hidden');
        btnLogout.classList.add('hidden');
        btnLogin.classList.remove('hidden');
        btnRegistrar.classList.remove('hidden');
    }
}

async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            tokenJWT = data.token;
            usuarioPapel = data.usuario.papel;
            usuarioNome = data.usuario.nome;
            
            localStorage.setItem('token', tokenJWT);
            localStorage.setItem('papel', usuarioPapel);
            localStorage.setItem('nome', usuarioNome);
            
            modalLogin.classList.add('hidden');
            loginForm.reset();
            verificarLogin();
            carregarProdutos();
        } else {
            alert("Erro de Login: " + (data.mensagem || "Credenciais inválidas"));
        }
    } catch (err) {
        alert("Falha na comunicação com o servidor.");
    }
}

function fazerLogout() {
    tokenJWT = null;
    usuarioPapel = null;
    usuarioNome = null;
    localStorage.removeItem('token');
    localStorage.removeItem('papel');
    localStorage.removeItem('nome');
    verificarLogin();
    carregarProdutos();
}

async function fazerRegistro() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const papel = document.getElementById('reg-papel').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, papel })
        });
        
        const data = await response.json();
        
        if (response.ok || data.sucesso) {
            alert("Conta criada com sucesso! Você já pode fazer login.");
            modalRegistrar.classList.add('hidden');
            registrarForm.reset();
            modalLogin.classList.remove('hidden');
        } else {
            alert("Erro ao registrar: " + (data.mensagem || data.erro || "Falha no cadastro"));
        }
    } catch (err) {
        alert("Falha na comunicação com o servidor.");
    }
}

// ----------------------------------------------------
// 3. FUNÇÃO: LISTAR PRODUTOS (GET)
// ----------------------------------------------------
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const data = await response.json();
        const produtos = data.dados || data;
        renderizarProdutos(produtos);
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productsGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: red;">Não foi possível conectar com a API. Verifique se o servidor Node está rodando.</p>';
    }
}

// ----------------------------------------------------
// 4. FUNÇÃO: DESENHAR PRODUTOS NA TELA (DOM MANIPULATION)
// ----------------------------------------------------
function renderizarProdutos(produtos) {
    productsGrid.innerHTML = '';

    if (!produtos || produtos.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #666;">Nenhum produto cadastrado na base de dados.</p>';
        return;
    }

    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let imgHtml = '<div class="card-img-placeholder">Sem Imagem</div>';
        if (produto.imagem) {
            imgHtml = `<img src="${API_URL}${produto.imagem}" alt="${produto.nome}">`;
        }

        const precoFormatado = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let actionsHtml = '';
        if (tokenJWT && usuarioPapel === 'admin') {
            actionsHtml = `
                <div class="card-actions">
                    <button class="btn edit" onclick="editarProduto(${produto.id})">Editar</button>
                    <button class="btn danger" onclick="excluirProduto(${produto.id})">Excluir</button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-img-container">
                ${imgHtml}
            </div>
            <div class="card-content">
                <h3 class="card-title">${produto.nome}</h3>
                <p class="card-desc">${produto.descricao}</p>
                <div class="card-price">${precoFormatado}</div>
                ${actionsHtml}
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// ----------------------------------------------------
// 5. FUNÇÃO: ABRIR FORMULÁRIO
// ----------------------------------------------------
function abrirModal(produto = null) {
    const idInput = document.getElementById('produto-id');
    const nomeInput = document.getElementById('nome');
    const descInput = document.getElementById('descricao');
    const precoInput = document.getElementById('preco');
    const catInput = document.getElementById('categoria');
    const dispInput = document.getElementById('disponivel');

    productForm.reset();
    
    if (produto) {
        modalTitle.textContent = 'Editar Produto';
        idInput.value = produto.id;
        nomeInput.value = produto.nome;
        descInput.value = produto.descricao;
        precoInput.value = produto.preco;
        catInput.value = produto.categoria || '';
        dispInput.checked = produto.disponivel;
    } else {
        modalTitle.textContent = 'Cadastrar Produto';
        idInput.value = '';
    }

    modal.classList.remove('hidden');
}

function fecharModal() {
    modal.classList.add('hidden');
}

// ----------------------------------------------------
// 6. FUNÇÃO: INSERIR OU ATUALIZAR (POST / PUT)
// ----------------------------------------------------
async function salvarProduto() {
    const id = document.getElementById('produto-id').value;
    const isEdit = !!id;
    
    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('descricao', document.getElementById('descricao').value);
    formData.append('preco', document.getElementById('preco').value);
    formData.append('categoria', document.getElementById('categoria').value);
    formData.append('disponivel', document.getElementById('disponivel').checked);
    
    const fileInput = document.getElementById('imagem');
    if (fileInput.files.length > 0) {
        formData.append('imagem', fileInput.files[0]);
    }

    const url = isEdit ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${tokenJWT}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (response.ok || data.sucesso) {
            fecharModal();
            carregarProdutos();
        } else {
            alert("Erro: " + (data.mensagem || data.erro || "Desconhecido"));
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro de conexão ao tentar salvar.");
    }
}

// ----------------------------------------------------
// 7. FUNÇÃO: BUSCAR 1 E JOGAR NA TELA (GET /id)
// ----------------------------------------------------
window.editarProduto = async function(id) {
    try {
        const response = await fetch(`${API_URL}/produtos/${id}`);
        const data = await response.json();
        const produto = data.dados || data;
        abrirModal(produto);
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
    }
}

// ----------------------------------------------------
// 8. FUNÇÃO: EXCLUIR (DELETE)
// ----------------------------------------------------
window.excluirProduto = async function(id) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            const response = await fetch(`${API_URL}/produtos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenJWT}`
                }
            });
            if (response.ok) {
                carregarProdutos();
            } else {
                const data = await response.json();
                alert("Erro ao excluir: " + (data.mensagem || data.erro));
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
        }
    }
}

// ----------------------------------------------------
// 9. FUNÇÃO: RELÓGIO COM DATA EM TEMPO REAL
// ----------------------------------------------------
function atualizarHorario() {
  const relogioEl = document.getElementById('relogio');
  if (!relogioEl) return;

  const agora = new Date();
  
  // Formata hora (ex: 12:41:52)
  const horaFormatada = agora.toLocaleTimeString('pt-BR');
  
  // Formata data (ex: Qui, 27 de Ago)
  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).replace('.', '');

  relogioEl.innerHTML = `
    <span style="opacity: 0.7; margin-right: 6px;"</span>
    <span>${dataFormatada} <strong>${horaFormatada}</strong></span>
  `;
}

// Atualiza a cada 1 segundo (1000ms)
setInterval(atualizarHorario, 1000);
atualizarHorario();