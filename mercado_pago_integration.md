# Integração do Mercado Pago (Pagamentos via Pix)

Para validar pagamentos reais via Pix usando o Mercado Pago, você precisará modificar tanto o seu backend (onde a API está hospedada no Render) quanto o frontend. 

O fluxo de um pagamento Pix funciona da seguinte forma:
1. O **Frontend** pede ao Backend para gerar uma cobrança Pix.
2. O **Backend** chama a API do Mercado Pago e devolve o código "Copia e Cola" e o QR Code.
3. O **Frontend** exibe o código para o usuário na tela.
4. O usuário realiza o pagamento no aplicativo do banco.
5. O **Mercado Pago** avisa o seu Backend automaticamente (via Webhook) que o pagamento foi aprovado.
6. O **Frontend** verifica se o pagamento foi aprovado e libera o acesso.

Abaixo está o guia passo a passo de como implementar.

## 1. Configuração no Mercado Pago
1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers).
2. Vá em **Suas integrações** e crie uma nova aplicação.
3. Obtenha as suas **Credenciais de Produção** (ou Teste) - você precisará do `Access Token`.

## 2. Implementação no Backend (Node.js/Express)

Você precisará instalar o SDK oficial do Mercado Pago no seu backend:

```bash
npm install mercadopago
```

Em seguida, adicione as seguintes rotas no seu servidor (API):

```javascript
import { MercadoPagoConfig, Payment } from 'mercadopago';
import express from 'express';

const app = express();
app.use(express.json());

// 1. Configurar as credenciais do Mercado Pago
// Substitua pelo seu Access Token real
const client = new MercadoPagoConfig({ accessToken: 'SEU_ACCESS_TOKEN_AQUI' });

// 2. Rota para GERAR a cobrança Pix
app.post('/api/criar-pagamento', async (req, res) => {
  const { email, plano } = req.body;
  
  // Defina os valores baseados no plano
  const valores = { 'PRO': 29.90, 'PREMIUM': 49.90 };
  const valor = valores[plano.toUpperCase()];

  try {
    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: valor,
        description: `Plano ${plano} - Monetra`,
        payment_method_id: 'pix',
        payer: { email: email } // O e-mail do usuário é obrigatório
      }
    });

    res.json({
      qr_code: result.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: result.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
});

// 3. Webhook (O Mercado Pago avisa o seu servidor quando for pago)
app.post('/api/webhook', async (req, res) => {
  // O Mercado Pago envia o ID do pagamento de diferentes formas dependendo da versão
  const paymentId = req.query['data.id'] || req.body?.data?.id;

  if (paymentId) {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        // PAGAMENTO APROVADO! 
        // AQUI você deve atualizar o status do usuário no seu Banco de Dados
        // Exemplo: await Usuario.updateOne({ email: paymentData.payer.email }, { status: 'ativo' })
        console.log(`Pagamento ${paymentId} aprovado com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
    }
  }
  
  // É obrigatório retornar status 200 (OK) pro Mercado Pago para ele parar de enviar a notificação
  res.sendStatus(200);
});

// 4. Rota para o Frontend consultar o status do pagamento em tempo real
app.get('/api/status-pagamento/:id', async (req, res) => {
  // O ideal é consultar direto no seu Banco de Dados se o webhook já atualizou.
  // Exemplo simplificado consultando direto a API do Mercado Pago:
  try {
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: req.params.id });
    res.json({ status: paymentData.status }); // retorna 'approved', 'pending', etc.
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
});
```

## 3. Implementação no Frontend (`payment.js`)

Agora, no lado do cliente (`c:\MonetraSecurity\payment.js`), você vai pedir o código Pix ao seu backend e verificar o status periodicamente:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get("email");
const plano = urlParams.get("plano") || "PRO";

// Atualiza a interface com o plano
document.getElementById("planBadge").textContent = `Plano ${plano}`;

let currentPaymentId = null;

// 1. Pedir a geração do Pix pro Backend ao invés de usar códigos estáticos
async function gerarPix() {
  const btn = document.getElementById("payButton");
  btn.textContent = "Gerando código Pix...";
  btn.disabled = true;

  try {
    const response = await fetch("https://firstapi-l386.onrender.com/api/criar-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plano })
    });
    
    if (!response.ok) throw new Error("Erro na requisição");

    const data = await response.json();
    
    // Atualiza a tela com o código Pix Copia e Cola
    document.getElementById("pixCode").textContent = data.qr_code;
    currentPaymentId = data.payment_id;
    
    // (Opcional) Se você quiser mostrar a imagem do QR Code na tela:
    // const qrImageContainer = document.getElementById("qrContainer");
    // qrImageContainer.innerHTML = `<img src="data:image/jpeg;base64,${data.qr_code_base64}" style="width: 100%; border-radius: 12px;"/>`;

    btn.textContent = "Aguardando confirmação do pagamento...";
    
    // Iniciar verificação automática (Polling)
    verificarStatusPeriodicamente();

  } catch (error) {
    console.error("Erro ao gerar Pix", error);
    btn.textContent = "Erro ao gerar. Atualize a página.";
  }
}

// 2. Função que verifica o status a cada 5 segundos
function verificarStatusPeriodicamente() {
  const intervalo = setInterval(async () => {
    if (!currentPaymentId) return;

    try {
      const response = await fetch(`https://firstapi-l386.onrender.com/api/status-pagamento/${currentPaymentId}`);
      const data = await response.json();

      if (data.status === "approved") {
        clearInterval(intervalo); // Para de verificar o status
        
        Swal.fire({
          icon: "success",
          title: "Pagamento Aprovado!",
          text: "Seu pagamento foi confirmado. Liberando acesso...",
          timer: 2500,
          showConfirmButton: false,
        }).then(() => {
          // Redireciona o usuário para a página de sucesso/dashboard
          window.location.href = `success.html?plano=${plano}`;
        });
      }
    } catch (error) {
      console.error("Erro ao checar status do pagamento", error);
    }
  }, 5000); // Executa a cada 5000ms (5 segundos)
}

function copyPix() {
  const code = document.getElementById("pixCode").textContent;
  navigator.clipboard.writeText(code).then(() => {
    Swal.fire({
      icon: "success",
      title: "Copiado!",
      text: "Código Pix copiado para a área de transferência.",
      timer: 1500,
      showConfirmButton: false,
    });
  });
}

// Inicia a geração do Pix assim que a página abrir
gerarPix();
```

## Considerações Finais
1. **Configurar Webhook no Painel:** Lembre-se de ir no painel do Mercado Pago Developers (em Configurações > Webhooks) e cadastrar a URL do seu servidor para receber as notificações: `https://firstapi-l386.onrender.com/api/webhook`. E selecione para receber eventos de **Pagamentos**.
2. **Segurança:** O frontend não deve alterar o banco de dados. É o seu *webhook* que deve ser o responsável principal por liberar o acesso do usuário no seu banco de dados, pois a verificação feita pelo frontend pode ser fraudada pelo navegador do usuário.
