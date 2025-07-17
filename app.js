const express = require('express');
const cors = require('cors');
const { obterTimelineDoNup } = require('./scrape-nup');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🟢 API Suite-Scraper ativa!');
});

app.get('/nup/:nup', async (req, res) => {
  const { nup } = req.params;

  try {
    const dados = await obterTimelineDoNup(nup);

    if (!dados) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao obter os dados do processo.',
      });
    }

    res.json({
      sucesso: true,
      dados,
    });
  } catch (error) {
    console.error('Erro no endpoint /nup:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno no servidor.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Suite-Scraper rodando na porta ${PORT}`);
});
