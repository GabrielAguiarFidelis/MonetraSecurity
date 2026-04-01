Swal.fire({
  icon: "success",
  title: "Pagamento realizado com sucesso!",
  text: "Sua assinatura foi ativada. Redirecionando para o dashboard...",
  showConfirmButton: false,
  timer: 2500,
});

// Redireciona para a página do plano
setTimeout(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const plano = urlParams.get("plano") || "PRO";

  if (plano === "PRO") {
    window.location.href = "./PlanPro/index.html";
  } else if (plano === "PREMIUM") {
    window.location.href = "./PlanPremium/index.html";
  } else {
    window.location.href = "./PlanFree/index.html";
  }
}, 2500);
