const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get("email");
const plano = urlParams.get("plano") || "PRO";

// Atualiza a interface com o plano
document.getElementById("planBadge").textContent = `Plano ${plano}`;

// Gera um código "Pix" fictício baseado no plano
const pixCodes = {
  PRO: "00020101021126580014br.gov.bcb.pix0136monetra-pro-key-12345678901234567890520400005303986540529.905802BR5915MonetraSecurity6009Sao Paulo62070503***6304E1A2",
  PREMIUM: "00020101021126580014br.gov.bcb.pix0136monetra-premium-key-09876543210987654321520400005303986540549.905802BR5915MonetraSecurity6009Sao Paulo62070503***6304B2C3",
};

const currentPixCode = pixCodes[plano.toUpperCase()] || pixCodes.PRO;
document.getElementById("pixCode").textContent = currentPixCode;

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

const payButton = document.getElementById("payButton");

payButton.addEventListener("click", () => {
  payButton.disabled = true;
  payButton.textContent = "Verificando pagamento...";

  // Simula uma verificação de 2 segundos
  setTimeout(() => {
    window.location.href = `success.html?plano=${plano}`;
  }, 2000);
});
