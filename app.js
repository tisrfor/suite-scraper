const express = require('express');
const cors = require('cors');
const { obterTimelineDoNup } = require('./scrape-nup');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor Suite-Scraper online. Use /nup/:nup para consultar.');
});

app.get('/nup/:nup', async (req, res) => {
  const nup = req.params.nup;

  if (!/^\d{17,}$/.test(nup)) {
    return res.status(400).json({ sucesso: false, erro: 'NUP inválido. Deve conter pelo menos 17 dígitos numéricos.' });
  }

  try {
    const dados = await obterTimelineDoNup(nup);
    res.json(dados);
  } catch (erro) {
    console.error('Erro ao consultar o NUP:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message || 'Erro interno.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor Suite-Scraper rodando na porta ${port}`);
});
