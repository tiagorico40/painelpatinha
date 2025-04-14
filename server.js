const express = require('express');
const session = require('express-session');
const path = require('path');
const fetch = require('node-fetch');
const auth = require('./auth');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'painel_super_secreto',
  resave: false,
  saveUninitialized: false
}));

const token = 'APP_USR-5431570390978701-041315-32076f4e4911ecd28d1daecbfa133e35-307004460';

async function pegarDoacoes() {
  const response = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();
  const doacoes = data.results.map(p => ({
    valor: `R$ ${(p.transaction_amount || 0).toFixed(2)}`,
    data: new Date(p.date_created).toLocaleDateString(),
    hora: new Date(p.date_created).toLocaleTimeString()
  }));

  return doacoes;
}

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (auth.validate(username, password)) {
    req.session.loggedIn = true;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Usuário ou senha inválidos' });
  }
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/login');
  res.render('dashboard');
});

// API para retornar dados atualizados em JSON
app.get('/api/doacoes', async (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: 'Não autorizado' });
  const doacoes = await pegarDoacoes();
  res.json(doacoes);
});

// API para exportar em TXT
app.get('/api/doacoes/txt', async (req, res) => {
  if (!req.session.loggedIn) return res.status(401).send('Não autorizado');
  const doacoes = await pegarDoacoes();
  const txt = doacoes.map(d => `Valor: ${d.valor} Data: ${d.data} Horário: ${d.hora}`).join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename="doacoes.txt"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(txt);
});

app.listen(3000, () => console.log('Painel rodando em http://localhost:3000'));