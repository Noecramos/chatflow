const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREVIEW_FILE = 'd:\\Antigravity\\chatflow\\preview.html';

const TABS = [
  { name: 'inbox', filename: 'screenshot_inbox.png' },
  { name: 'ecommerce', filename: 'screenshot_ecommerce.png' },
  { name: 'crm', filename: 'screenshot_crm.png' },
  { name: 'agentes', filename: 'screenshot_agentes.png' },
  { name: 'noviapi', filename: 'screenshot_noviapi.png' }
];

function captureScreenshot(tab) {
  return new Promise((resolve, reject) => {
    const fileUrl = `file:///${PREVIEW_FILE.replace(/\\/g, '/')}?tab=${tab.name}`;
    const outputImgPath = path.join('d:\\Antigravity\\chatflow', tab.filename);

    console.log(`[CAPTURE] Capturando aba '${tab.name}' em alta definição...`);
    
    // Arguments for headless chrome to take a perfect screenshot
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--window-size=1920,1080',
      `--screenshot=${outputImgPath}`,
      fileUrl
    ];

    execFile(CHROME_PATH, args, (error, stdout, stderr) => {
      if (error) {
        console.error(`[ERRO] Falha ao capturar screenshot de ${tab.name}:`, error);
        return reject(error);
      }
      
      if (fs.existsSync(outputImgPath)) {
        console.log(`[SUCESSO] Screenshot gerada: ${outputImgPath} (${fs.statSync(outputImgPath).size} bytes)`);
        resolve(outputImgPath);
      } else {
        console.error(`[FALHA] O arquivo de screenshot não foi encontrado após execução.`);
        reject(new Error(`File not created: ${outputImgPath}`));
      }
    });
  });
}

async function run() {
  console.log('=== INICIANDO GERAÇÃO DE PRINTS REAIS DO SAAS CHATFLOW ===');
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`[ERRO CRÍTICO] Google Chrome não foi encontrado no caminho: ${CHROME_PATH}`);
    process.exit(1);
  }

  for (const tab of TABS) {
    try {
      await captureScreenshot(tab);
      // Wait a moment between captures
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`Falha ao gerar print para ${tab.name}. Prosseguindo...`);
    }
  }
  console.log('=== GERAÇÃO DE IMAGENS CONCLUÍDA COM SUCESSO! ===');
}

run();
