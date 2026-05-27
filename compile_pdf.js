const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const INPUT_HTML_FILE = 'd:\\Antigravity\\chatflow\\presentation.html';
const OUTPUT_PDF_FILE = 'd:\\Antigravity\\chatflow\\Apresentacao_ChatFlow_NoviApp.pdf';

function compilePdf() {
  return new Promise((resolve, reject) => {
    const fileUrl = `file:///${INPUT_HTML_FILE.replace(/\\/g, '/')}`;

    console.log('[COMPILE] Compilando a apresentação comercial HTML para PDF em formato paisagem...');
    
    // Arguments to print a perfect presentation to PDF without standard browser headers/footers
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--window-size=1920,1080',
      `--print-to-pdf=${OUTPUT_PDF_FILE}`,
      '--print-to-pdf-no-header',
      fileUrl
    ];

    execFile(CHROME_PATH, args, (error, stdout, stderr) => {
      if (error) {
        console.error('[ERRO] Falha ao compilar PDF:', error);
        return reject(error);
      }
      
      if (fs.existsSync(OUTPUT_PDF_FILE)) {
        console.log(`[SUCESSO] Apresentação em PDF gerada com sucesso: ${OUTPUT_PDF_FILE} (${fs.statSync(OUTPUT_PDF_FILE).size} bytes)`);
        resolve(OUTPUT_PDF_FILE);
      } else {
        console.error('[FALHA] O arquivo PDF não foi encontrado após a compilação.');
        reject(new Error(`File not created: ${OUTPUT_PDF_FILE}`));
      }
    });
  });
}

async function run() {
  console.log('=== INICIANDO COMPILAÇÃO DA APRESENTAÇÃO CHATFLOW EM PDF ===');
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`[ERRO CRÍTICO] Google Chrome não foi encontrado no caminho: ${CHROME_PATH}`);
    process.exit(1);
  }

  try {
    const result = await compilePdf();
    console.log('=== COMPILAÇÃO CONCLUÍDA COM EXCELÊNCIA! ===');
  } catch (e) {
    console.error('Falha crítica na compilação do PDF:', e.message);
  }
}

run();
