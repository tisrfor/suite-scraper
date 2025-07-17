const puppeteer = require('puppeteer');

async function scrapeProcesso(nup) {
  console.log(`Iniciando scraping do NUP: ${nup}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://suite.ce.gov.br/consultar-processo', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[placeholder="Pesquise por NUP, nome ou assunto"]', { timeout: 30000 });
    await page.type('input[placeholder="Pesquise por NUP, nome ou assunto"]', nup);
    await page.keyboard.press('Enter');

    await page.waitForSelector('div.timeline-panel', { timeout: 30000 });
    await page.waitForSelector('div.has-text-weight-semibold.header-label.spacing-mb-20', { timeout: 30000 });

    const dados = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };

      const assunto = (() => {
        const el = Array.from(document.querySelectorAll('div.is-size-6.has-text-weight-semibold.spacing-my-10'))
          .find(div => div.textContent.trim().startsWith('Assunto:'));
        return el ? el.textContent.replace('Assunto:', '').trim() : '';
      })();

      const orgao = (() => {
        const spans = Array.from(document.querySelectorAll('span.has-text-weight-medium'));
        const span = spans.find(s => s.textContent.includes('Órgão:'));
        return span?.nextElementSibling?.textContent.trim() || '';
      })();

      const unidade = (() => {
        const spans = Array.from(document.querySelectorAll('span.has-text-weight-medium'));
        const span = spans.find(s => s.textContent.includes('Unidade:'));
        return span?.nextElementSibling?.textContent.trim() || '';
      })();

      const dataAbertura = (() => {
        const spans = Array.from(document.querySelectorAll('span.has-text-weight-semibold'));
        const span = spans.find(s => s.textContent.includes('Data de abertura:'));
        if (span?.parentElement) {
          const match = span.parentElement.textContent.match(/Data de abertura:\s*(.+)/);
          return match ? match[1].trim() : '';
        }
        return '';
      })();

      const prioridade = (() => {
        const ps = Array.from(document.querySelectorAll('p.has-text-weight-semibold'));
        const p = ps.find(p => p.textContent.includes('Nível de prioridade:'));
        if (p?.parentElement) {
          const match = p.parentElement.textContent.match(/Nível de prioridade:\s*(.+)/);
          return match ? match[1].trim() : '';
        }
        return '';
      })();

      const acesso = (() => {
        const ps = Array.from(document.querySelectorAll('p.has-text-weight-semibold'));
        const p = ps.find(p => p.textContent.includes('Nível de acesso:'));
        if (p?.parentElement) {
          const match = p.parentElement.textContent.match(/Nível de acesso:\s*(.+)/);
          return match ? match[1].trim() : '';
        }
        return '';
      })();

      const headerDiv = document.querySelector('div.has-text-weight-semibold.header-label.spacing-mb-20');
      let tramitacoesCount = '';
      let tempoTotal = '';

      if (headerDiv) {
        const spans = headerDiv.querySelectorAll('span');
        if (spans.length >= 4) {
          tramitacoesCount = spans[1].textContent.trim();
          const tempoSpan = spans[3];
          const match = tempoSpan.textContent.match(/Tempo total do processo \(ativo\):\s*(.+)/);
          tempoTotal = match ? match[1].trim() : '';
        }
      }

      const tramitacoes = [];
      const tramElements = document.querySelectorAll('div.timeline-panel');

      tramElements.forEach(el => {
        const dataHora = el.querySelector('h4.timeline-title')?.textContent.trim() || '';

        let permanencia = '';
        const h5Element = el.querySelector('h5.timeline-title.spacing-ml-30');
        if (h5Element) {
          const fullText = h5Element.textContent || '';
          permanencia = fullText.replace(/Permanência\s*:/i, '').trim();
        }

        const situacaoEl = el.querySelector('p span.has-text-weight-medium');
        const situacaoText = situacaoEl?.parentElement?.textContent.trim() || '';
        const situacao = situacaoText.replace('Situação:', '').trim();

        const orgaoEl = el.querySelectorAll('p span.has-text-weight-medium')[1];
        let orgaoUnidade = '';
        if (orgaoEl) {
          const orgaoText = orgaoEl.parentElement.textContent.trim();
          orgaoUnidade = orgaoText.replace('Órgão/Unidade:', '').trim();
        }

        tramitacoes.push({
          dataHora,
          permanencia,
          situacao,
          orgaoUnidade
        });
      });

      return {
        assunto,
        orgao,
        unidade,
        dataAbertura,
        prioridade,
        acesso,
        tramitacoesCount,
        tempoTotal,
        tramitacoes
      };
    });

    console.log('Dados coletados:', dados);
    return dados;

  } catch (error) {
    console.error(`❌ Erro no Puppeteer para NUP ${nup}:`, error.message);
    return { sucesso: false, erro: error.message };
  } finally {
    await browser.close();
    console.log(`✅ Processo finalizado para o NUP: ${nup}`);
  }
}

// Exportar como módulo com nome correto
module.exports = { obterTimelineDoNup: scrapeProcesso };

// Rodar diretamente via terminal
if (require.main === module) {
  const nup = process.argv[2];
  if (!nup) {
    console.error('Por favor, informe o NUP como argumento: node scrape-nup.js <NUP>');
    process.exit(1);
  }

  scrapeProcesso(nup);
}
