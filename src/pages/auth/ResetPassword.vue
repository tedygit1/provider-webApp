<template>
  <div class="reset-page">
    <div class="reset-card">
      <h2>Set New Password</h2>
      <p class="subtitle">Create a new password for your account.</p>

      <form class="form" @submit.prevent="resetPassword">
        <input
          v-model="password"
          type="password"
          placeholder="New Password"
          required
        />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm New Password"
          required
        />
        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? "Resetting..." : "Reset Password" }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import http from "@/api/index.js";

const router = useRouter();
const route = useRoute();
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

// ✅ Extract token from /reset-password/:token
const token = route.params.token;

onMounted(() => {
  if (!token) {
    alert("❌ Invalid reset link. Please request a new one.");
    router.push("/forgot-password");
  }
});

async function resetPassword() {
  if (!password.value || !confirmPassword.value) {
    error.value = "All fields are required.";
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  try {
    loading.value = true;
    error.value = "";

    // ✅ Ensure token exists
    if (!token) {
      throw new Error("No reset token found.");
    }

    // ✅ Send to backend
    await http.post(`/auth/reset-password/${token}`, {
      password: password.value
    });

    alert("✅ Password reset successful!");
    router.push("/login");

  } catch (err) {
    error.value = err.response?.data?.message || "Reset failed. Link may be expired.";
    console.error("Reset error:", err.response?.data || err.message);
  } finally {
    loading.value = false;
  }
}
</script>
<style scoped>
/* Same as ForgotPassword.vue */
.reset-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #93c5fd, #a7f3d0);
  padding: 2rem;
}
.reset-card {
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
.error {
  color: #ef4444;
  font-size: 0.85rem;
}
</style>