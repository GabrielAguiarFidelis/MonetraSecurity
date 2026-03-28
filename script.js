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
document.querySelector(".login form").addEventListener("submit", async (e) => {
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
    window.location.href = "/dashboard.html";
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

    const nome = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const plano = document.getElementById("planInput").value.toUpperCase();

    try {
      const response = await fetch(
        "https://firstapi-l386.onrender.com/usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nome, email, password, plano }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Algo deu errado",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Conta criada com sucesso 🚀",
        text: "Faça login para acessar seu dashboard",
        confirmButtonColor: "#3085d6",
      });

      // opcional: trocar pro login
      document.querySelector(".login-btn").click();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao conectar com servidor",
      });
    }
  });
