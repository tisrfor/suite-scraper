const express = require('express');
const cors = require('cors');
const obterTimelineDoNup = require('./scrape-nup'); // Importa a função diretamente

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🟢 API Suite-Scraper ativa!');
});

app.get('/nup/:nup', async (req, res) => {
  const { nup } = req.params;
  console.log(`Recebida requisição para NUP: ${nup}`);

  try {
    const resultado = await obterTimelineDoNup(nup);

    if (!resultado) {
      console.error('Erro: resultado undefined do scraper');
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao obter os dados do processo.',
      });
    }

    if (!resultado.sucesso) {
      console.warn(`Scraper retornou erro para NUP ${nup}: ${resultado.erro}`);
      return res.status(400).json({
        sucesso: false,
        erro: resultado.erro || 'Erro ao buscar dados do processo.',
      });
    }

    res.json({
      sucesso: true,
      dados: resultado.dados,
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
