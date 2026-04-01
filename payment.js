const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get("email");
const plano = urlParams.get("plano");

document.getElementById("planInfo").innerHTML = `
    <strong>Plano:</strong> ${plano}<br>
    <strong>Email:</strong> ${email}
  `;

const payButton = document.getElementById("payButton");

payButton.addEventListener("click", async () => {
  payButton.disabled = true;
  payButton.textContent = "Redirecionando para o Stripe...";

  try {
    const response = await fetch(
      "http://localhost:3000/create-checkout-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plano }),
      },
    );

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível gerar o pagamento",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Erro de conexão com o servidor",
    });
  }
});
