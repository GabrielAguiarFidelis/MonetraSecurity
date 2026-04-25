# Integração Banco Inter (API Pix)

Sim, é perfeitamente possível usar o Banco Inter para gerar e validar pagamentos via Pix de forma automatizada. No entanto, a integração com o Banco Inter possui regras mais rígidas de segurança e é voltada para empresas.

## Principais Diferenças (Inter vs Mercado Pago)
| Característica | Mercado Pago | Banco Inter |
| :--- | :--- | :--- |
| **Tipo de Conta** | Física (CPF) ou Jurídica (CNPJ) | **Apenas Conta Jurídica (PJ)** |
| **Autenticação** | Token simples (`Access Token`) | **mTLS (Certificados `.crt` e `.key`)** + OAuth2 |
| **SDK** | SDK Oficial para Node.js (`mercadopago`) | Sem SDK Oficial (chamadas HTTPS diretas) |
| **Imagem do QR Code** | Já vem gerada pela API (base64) | Você precisa gerar no Frontend a partir do código |

---

## 1. Pré-requisitos
1. Ter uma conta **Pessoa Jurídica (PJ)** no Banco Inter.
2. Acessar o Internet Banking pelo computador, ir no menu **Soluções para sua empresa > Nova integração**.
3. Criar a aplicação, obter o `Client ID`, `Client Secret` e **baixar o Certificado Digital**.
4. O certificado baixado é essencial para o servidor funcionar. Você precisará extrair os arquivos `.crt` (certificado) e `.key` (chave privada).

## 2. Implementação no Backend (Node.js/Express)

Como o Banco Inter exige **mTLS** (Autenticação TLS Mútua), você não consegue fazer a requisição apenas com uma senha. O seu código precisa enviar o certificado junto na requisição HTTP. Vamos usar a biblioteca `axios` para isso.

```bash
npm install axios
```

Exemplo de implementação na sua API no Render:

```javascript
import express from 'express';
import axios from 'axios';
import https from 'https';
import fs from 'fs';

const app = express();
app.use(express.json());

// 1. Carregar os Certificados do Banco Inter do seu servidor
// ATENÇÃO: Nunca coloque esses arquivos no GitHub público!
const certFile = fs.readFileSync('./certificados/inter.crt');
const keyFile = fs.readFileSync('./certificados/inter.key');

const httpsAgent = new https.Agent({
  cert: certFile,
  key: keyFile,
});

const clientId = 'SEU_CLIENT_ID';
const clientSecret = 'SEU_CLIENT_SECRET';

// 2. Função auxiliar para Obter o Token OAuth do Inter
async function getInterToken() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await axios.post(
    'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
    'grant_type=client_credentials&scope=cob.write cob.read pix.write pix.read webhook.write webhook.read',
    {
      httpsAgent, // O Certificado é enviado aqui
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    }
  );
  
  return response.data.access_token; // Esse token vale por apenas 60 minutos
}

// 3. Rota para Gerar a Cobrança Pix
app.post('/api/inter/criar-pagamento', async (req, res) => {
  const { plano } = req.body;
  const valores = { 'PRO': '29.90', 'PREMIUM': '49.90' }; // No Inter, os valores são enviados como string

  try {
    const token = await getInterToken();
    
    const txid = `monetra${Date.now()}`; // ID único da transação (você quem cria)
    
    // Cria a cobrança via API do Banco Central implementada pelo Inter
    const response = await axios.put(
      `https://cdpj.partners.bancointer.com.br/pix/v2/cob/${txid}`,
      {
        calendario: { expiracao: 3600 },
        valor: { original: valores[plano.toUpperCase()] },
        chave: 'SUA_CHAVE_PIX_CADASTRADA_NO_INTER', // Obrigatório
        infoAdicionais: [{ nome: "Plano", valor: plano }]
      },
      {
        httpsAgent, // Certificado enviado novamente
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      qr_code: response.data.pixCopiaECola, // O frontend vai usar isso
      txid: response.data.txid 
    });
    
  } catch (error) {
    console.error("Erro na API do Inter:", error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar Pix no Inter' });
  }
});

// 4. Rota do Webhook (O Inter avisa seu servidor quando o usuário pagar)
app.post('/api/inter/webhook', async (req, res) => {
  const pixRecebidos = req.body.pix; // Pode vir mais de um Pix no mesmo aviso
  
  if (pixRecebidos && pixRecebidos.length > 0) {
    for (const pix of pixRecebidos) {
      const txid = pix.txid;
      // PAGAMENTO APROVADO!
      // AQUI você deve atualizar o status do usuário no Banco de Dados
      console.log(`Pix pago! TXID: ${txid}, Valor: ${pix.valor}`);
    }
  }

  // Responda o Inter para ele parar de tentar notificar
  res.sendStatus(200);
});
```

## 3. O que muda no Frontend?
No frontend, o processo de "esperar" (Polling) continua igual ao do Mercado Pago.
A principal diferença é que a API do Inter **não gera a imagem do QR Code**. Ela te devolve apenas o texto do "Copia e Cola".

Portanto, em `payment.js`, você precisará usar uma biblioteca como `qrcode.js` para desenhar o quadradinho do QR Code na tela com base no texto que o seu backend retornou:

```javascript
// Exemplo usando uma lib de QR Code no frontend
document.getElementById("pixCode").textContent = data.qr_code; // Copia e Cola

// Gerar a imagem:
new QRCode(document.getElementById("qrContainer"), data.qr_code);
```

## Resumo: Inter ou Mercado Pago?
- Se você **tem um CNPJ**, quer ter controle total da operação e **taxa zero** no Pix recebido, o **Banco Inter** é muito superior em custos. No entanto, exigirá que você lide com a logística de salvar os arquivos `.crt` e `.key` no seu servidor de forma segura.
- Se você é **Pessoa Física (CPF)** ou quer uma **integração rápida e mais fácil** para testar sua aplicação, use o **Mercado Pago**.
