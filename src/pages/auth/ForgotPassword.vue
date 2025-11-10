<!-- src/pages/auth/ForgotPassword.vue -->
<template>
  <div class="forgot-page">
    <div class="forgot-card">
      <h2>Forgot Password?</h2>
      <p class="subtitle">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form class="form" @submit.prevent="sendResetLink">
        <input
          v-model="email"
          type="email"
          placeholder="Your Email"
          required
        />
        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? "Sending..." : "Send Reset Link" }}
        </button>
        <p class="back-text" @click="goToLogin">← Back to Login</p>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import http from "@/api/index.js";

const router = useRouter();
const email = ref("");
const loading = ref(false);
const error = ref("");

async function sendResetLink() {
  if (!email.value) {
    error.value = "Please enter your email.";
    return;
  }

  try {
    loading.value = true;
    error.value = "";

    // ✅ Connect to backend endpoint
    await http.post("/auth/forgot-password", { email: email.value });

    alert("✅ Reset link sent! Check your email.");
    router.push("/login");

  } catch (err) {
    error.value = err.response?.data?.message || "Failed to send reset link.";
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push("/login");
}
</script>

<style scoped>
/* Keep your existing styles */
.forgot-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #93c5fd, #a7f3d0);
  padding: 2rem;
}
.forgot-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  max-width: 420px;
  width: 100%;
  text-align: center;
}
h2 {
  color: #2563eb;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}
.subtitle {
  color: #64748b;
  margin-bottom: 1.5rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
input {
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 1rem;
}
.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.back-text {
  margin-top: 1rem;
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
}
.error {
  color: #ef4444;
  font-size: 0.85rem;
}
</style>