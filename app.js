// app.js (novo formato para funcionar no Render)
const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Suite-Scraper online. Use /nup/:nup para consultar.');
});

app.get('/nup/:nup', (req, res) => {
  const nup = req.params.nup;

  if (!/^\d{17,}$/.test(nup)) {
    return res.status(400).json({ erro: 'NUP inválido. Deve conter pelo menos 17 dígitos numéricos.' });
  }

  const comando = `node scrape-nup.js ${nup}`;
  exec(comando, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Erro ao executar o scraper:', error);
      return res.status(500).json({ erro: 'Erro ao consultar o NUP.', detalhe: stderr || error.message });
    }

    try {
      const resultado = JSON.parse(stdout);
      res.json(resultado);
    } catch (e) {
      console.error('Erro ao parsear o JSON:', e);
      res.status(500).json({ erro: 'Resposta inválida do scraper.', resposta: stdout });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Suite-Scraper rodando na porta ${PORT}`);
});
