// =============================================
// FinControl — Autenticação (Supabase Auth)
// =============================================

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const nomeGroup = document.getElementById('nome-group');
const nomeInput = document.getElementById('nome-input');
const submitBtn = document.getElementById('submit-btn');
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const toggleText = document.getElementById('toggle-text');
const errorMsg = document.getElementById('error-message');
const successMsg = document.getElementById('success-message');
const pageLoader = document.getElementById('page-loader');

let isLoginMode = true;

// ===== Check existing session =====
async function checkSession() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      window.location.href = 'dashboard.html';
      return;
    }
  } catch (e) {
    console.error('Erro ao verificar sessão:', e);
  }
  pageLoader.classList.add('hidden');
}

// ===== Toggle Login / Signup =====
toggleModeBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';

  if (isLoginMode) {
    submitBtn.textContent = 'Entrar';
    toggleText.textContent = 'Não tem conta?';
    toggleModeBtn.textContent = 'Criar conta';
    nomeGroup.classList.add('hidden');
    nomeInput.removeAttribute('required');
  } else {
    submitBtn.textContent = 'Criar conta';
    toggleText.textContent = 'Já tem conta?';
    toggleModeBtn.textContent = 'Entrar';
    nomeGroup.classList.remove('hidden');
    nomeInput.setAttribute('required', '');
  }
});

// ===== Show messages =====
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  successMsg.style.display = 'none';
}

function showSuccess(msg) {
  successMsg.textContent = msg;
  successMsg.style.display = 'block';
  errorMsg.style.display = 'none';
}

// ===== Translate common Supabase errors =====
function translateError(message) {
  const map = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'Signup requires a valid password': 'Insira uma senha válida.',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  };
  return map[message] || message;
}

// ===== Form submit =====
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span>';

  try {
    if (isLoginMode) {
      // LOGIN
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      window.location.href = 'dashboard.html';
    } else {
      // SIGNUP
      const nome = nomeInput.value.trim();
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { nome }
        }
      });
      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        showSuccess('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  } catch (err) {
    showError(translateError(err.message));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar conta';
  }
});

// ===== Init =====
checkSession();
