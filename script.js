const container = document.querySelector(".container");
const loginBtn = document.querySelector(".login-btn");
const registerBtn = document.querySelector(".register-btn");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Dropdown de planos
function togglePlans() {
  const dropdown = document.getElementById("planDropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

function selectPlan(plan) {
  document.getElementById("selectedText").innerText = plan.toUpperCase();
  document.getElementById("planInput").value = plan;
  document.getElementById("planDropdown").style.display = "none";
}

/* fecha se clicar fora */
document.addEventListener("click", function (e) {
  const box = document.querySelector(".select-box");
  if (!box.contains(e.target)) {
    document.getElementById("planDropdown").style.display = "none";
  }
});

// Validação de formulário
document.querySelector("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("https://firstapi-l386.onrender.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error);
      return;
    }

    // 💾 salva token
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    Swal.fire({
      icon: "success",
      title: "Login bem-sucedido!",
      text: "Redirecionando para o dashboard...",
      showConfirmButton: false,
      timer: 1500,
    });

    // redireciona
    window.location.href = "./PlanFree/index.html";
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
});

// ================= REGISTER =================
document
  .querySelector("#registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    let plano = document.getElementById("planInput").value.toUpperCase().trim();

    if (!nome || !email || !password || !plano) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Preencha todos os campos!",
      });
      return;
    }

    try {
      const response = await fetch(
        "https://firstapi-l386.onrender.com/usuarios",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, password, plano }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao criar conta",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Conta criada!",
        text:
          plano === "FREE"
            ? "Redirecionando para o plano Free..."
            : `Redirecionando para pagamento do plano ${plano}...`,
        showConfirmButton: false,
        timer: 1600,
      });

      // === LÓGICA DE REDIRECIONAMENTO ===
      setTimeout(() => {
        if (plano === "FREE") {
          window.location.href = "./PlanFree/index.html";
        } else if (plano === "PRO" || plano === "PREMIUM") {
          // Redireciona para página de pagamento passando o email e o plano
          window.location.href = `./payment.html?email=${encodeURIComponent(email)}&plano=${plano}`;
        } else {
          window.location.href = "./PlanFree/index.html"; // fallback
        }
      }, 1600);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao conectar com o servidor",
      });
    }
  });
