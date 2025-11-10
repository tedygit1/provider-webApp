<!-- src/pages/Providers/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <aside class="dashboard-sidebar">
      <div class="sidebar-top">
        <h2 class="sidebar-title">Provider Dashboard</h2>

        <!-- Welcome Message -->
        <div class="welcome-message" v-if="provider">
          Welcome back, {{ provider.fullname || 'Provider' }} 👋
        </div>

        <ul class="sidebar-menu">
          <li @click="goTo('home')" :class="{ active: activeTab === 'home' }">
            <i class="fa-solid fa-house"></i> Home
          </li>
          <li @click="goTo('profile')" :class="{ active: activeTab === 'profile' }">
            <i class="fa-solid fa-user"></i> My Profile
          </li>
          <li @click="goTo('services')" :class="{ active: activeTab === 'services' }">
            <i class="fa-solid fa-briefcase"></i> My Services
          </li>
          <li @click="goTo('bookings')" :class="{ active: activeTab === 'bookings' }">
            <i class="fa-solid fa-calendar-check"></i> Bookings
          </li>
          <li @click="goTo('earnings')" :class="{ active: activeTab === 'earnings' }">
            <i class="fa-solid fa-wallet"></i> Earnings
          </li>
          <li @click="goTo('messages')" :class="{ active: activeTab === 'messages' }">
            <i class="fa-solid fa-envelope"></i> Messages
          </li>
          <li @click="goTo('analytics')" :class="{ active: activeTab === 'analytics' }">
            <i class="fa-solid fa-chart-line"></i> Analytics
          </li>
          <li @click="goTo('reviews')" :class="{ active: activeTab === 'reviews' }">
            <i class="fa-solid fa-star"></i> Reviews
          </li>
          <li @click="goTo('settings')" :class="{ active: activeTab === 'settings' }">
            <i class="fa-solid fa-gear"></i> Settings
          </li>
        </ul>
      </div>

      <div class="sidebar-bottom">
        <button @click="logout" :disabled="loggingOut" class="logout-btn">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span v-if="!loggingOut">Logout</span>
          <span v-else>Logging out...</span>
        </button>
      </div>
    </aside>

    <!-- Main Dynamic Content -->
    <main class="dashboard-main">
      <component 
        :is="currentView" 
        :provider="provider" 
        @profileUpdated="handleProfileUpdated"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import http from "@/api/index.js";

// Components
import HomeDashboard from "./HomeDashboard.vue";
import ProfileSection from "./ProfileSection.vue";
import ServicesSection from "./Services/ServicesSection.vue";
import BookingsSection from "./BookingsSection.vue";
import EarningsSection from "./EarningsSection.vue";
import MessagesSection from "./MessagesSection.vue";
import AnalyticsSection from "./AnalyticsSection.vue";
import ReviewsSection from "./ReviewsSection.vue";
import SettingsSection from "./SettingsSection.vue";

const router = useRouter();
const activeTab = ref("home");
const loggingOut = ref(false);
const provider = ref(null);

const viewMap = {
  home: HomeDashboard,
  profile: ProfileSection,
  services: ServicesSection,
  bookings: BookingsSection,
  earnings: EarningsSection,
  messages: MessagesSection,
  analytics: AnalyticsSection,
  reviews: ReviewsSection,
  settings: SettingsSection,
};

const currentView = computed(() => viewMap[activeTab.value]);

function goTo(tab) {
  activeTab.value = tab;
}

async function logout() {
  loggingOut.value = true;
  localStorage.removeItem("provider_token");
  localStorage.removeItem("loggedProvider");
  localStorage.removeItem("provider_id");
  await router.push({ name: "Login" });
  loggingOut.value = false;
}

async function fetchProvider() {
  const token = localStorage.getItem("provider_token");
  if (!token) {
    console.warn("No token found. Redirecting to login...");
    return router.push({ name: "Login" });
  }

  try {
    const res = await http.get("/users/profile");
    provider.value = res.data;
    
    // Ensure provider_id is always saved
    if (res.data._id) {
      localStorage.setItem("provider_id", res.data._id);
    }
  } catch (err) {
    console.error("Profile load failed:", err.response?.data || err.message);
    localStorage.removeItem("provider_token");
    localStorage.removeItem("provider_id");
    localStorage.removeItem("loggedProvider");
    router.push({ name: "Login" });
  }
}

async function handleProfileUpdated() {
  // Refresh provider data after profile update
  await fetchProvider();
}

onMounted(() => {
  fetchProvider();
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: "Poppins", sans-serif;
}

.dashboard-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #0056cc, #0077ff);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.8rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  box-shadow: 3px 0 15px rgba(0, 0, 0, 0.15);
}

.sidebar-top {
  overflow-y: auto;
}

.sidebar-title {
  text-align: center;
  font-size: 1.7rem;
  margin-bottom: 1.2rem;
  font-weight: 700;
}

.welcome-message {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #fff;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  margin: 0.4rem 0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.sidebar-menu li i {
  width: 20px;
  text-align: center;
}

.sidebar-menu li.active,
.sidebar-menu li:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(4px);
}

.sidebar-bottom {
  margin-top: auto;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background: #ff4d4f;
  color: #fff;
  padding: 0.9rem 1.2rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
  font-size: 1rem;
}

.logout-btn:hover:not(:disabled) {
  background: #ff1a1a;
  transform: translateY(-2px);
}

.logout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.dashboard-main {
  flex: 1;
  margin-left: 260px;
  background: #f8fafc;
  padding: 2rem;
  height: 100vh;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 900px) {
  .dashboard-sidebar {
    width: 80px;
  }
  
  .sidebar-title,
  .welcome-message,
  .sidebar-menu li:not(.active) span,
  .sidebar-menu li:not(.active) i {
    display: none;
  }
  
  .sidebar-menu li {
    justify-content: center;
    padding: 0.8rem;
  }
  
  .sidebar-menu li i {
    font-size: 1.2rem;
  }
  
  .dashboard-main {
    margin-left: 80px;
  }
}
</style>