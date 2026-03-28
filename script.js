const container = document.querySelector(".container");
const loginBtn = document.querySelector(".login-btn");
const registerBtn = document.querySelector(".register-btn");

registerBtn.addEventListener("click", () => {
    container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
    container.classList.remove("active");
});


function togglePlans() {
    const dropdown = document.getElementById("planDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function selectPlan(plan) {
    document.getElementById("selectedText").innerText = plan.toUpperCase();
    document.getElementById("planInput").value = plan;
    document.getElementById("planDropdown").style.display = "none";
}

/* fecha se clicar fora */
document.addEventListener("click", function(e) {
    const box = document.querySelector(".select-box");
    if (!box.contains(e.target)) {
        document.getElementById("planDropdown").style.display = "none";
    }
});