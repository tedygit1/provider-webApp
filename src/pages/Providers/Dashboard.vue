<!-- src/pages/Providers/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button @click="toggleSidebar" class="hamburger-btn" aria-label="Menu">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h1 class="mobile-title">Provider Hub</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Sidebar -->
    <aside
      class="dashboard-sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
    >
      <div class="sidebar-inner">
        <div class="logo-section">
          <div class="logo-icon">💼</div>
          <h2 class="sidebar-title">Provider Hub</h2>
        </div>

        <div class="welcome-card" v-if="provider">
          <i class="fa-solid fa-circle-user user-icon"></i>
          <div class="welcome-text">
            <div class="welcome-label">Welcome back,</div>
            <div class="welcome-name">{{ provider.fullname || 'Provider' }}</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <ul class="sidebar-menu">
            <li
              v-for="(item, key) in menuItems"
              :key="key"
              @click="goTo(key)"
              :class="{ active: isActiveRoute(key) }"
            >
              <i :class="item.icon"></i>
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </nav>
      </div>

      <div class="sidebar-footer">
        <button @click="logout" :disabled="loggingOut" class="logout-btn">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>{{ loggingOut ? 'Logging out...' : 'Logout' }}</span>
        </button>
      </div>
    </aside>

    <!-- Overlay -->
    <div v-if="sidebarOpen" class="mobile-overlay" @click="toggleSidebar"></div>

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Use router-view for proper routing -->
      <router-view 
        :provider="provider" 
        @profileUpdated="handleProfileUpdated"
      />
      
      <!-- Fallback for when no route matches -->
      <div v-if="!$route.name" class="fallback-content">
        <h2>🏡 Dashboard Loaded!</h2>
        <p>Select a tab from the menu or use router navigation.</p>
        <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">
          Current Route: {{ $route.path }}
        </p>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import http from "@/api/index.js";

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    const loggingOut = ref(false);
    const provider = ref(null);
    const sidebarOpen = ref(false);

    // Menu items with route names
    const menuItems = {
      home: { label: "Home", icon: "fa-solid fa-house", route: "ProviderHome" },
      profile: { label: "My Profile", icon: "fa-solid fa-user", route: "ProviderProfile" },
      services: { label: "My Services", icon: "fa-solid fa-briefcase", route: "ProviderServices" },
      bookings: { label: "Bookings", icon: "fa-solid fa-calendar-check", route: "ProviderBookings" },
      earnings: { label: "Earnings", icon: "fa-solid fa-wallet", route: "ProviderEarnings" },
      messages: { label: "Messages", icon: "fa-solid fa-envelope", route: "ProviderMessages" },
      analytics: { label: "Analytics", icon: "fa-solid fa-chart-line", route: "ProviderAnalytics" },
      reviews: { label: "Reviews", icon: "fa-solid fa-star", route: "ProviderReviews" },
      settings: { label: "Settings", icon: "fa-solid fa-gear", route: "ProviderSettings" },
    };

    // Check if current route matches menu item
    const isActiveRoute = (menuKey) => {
      const menuRoute = menuItems[menuKey]?.route;
      if (!menuRoute) return false;
      
      // Special case for home route
      if (menuRoute === "ProviderHome" && route.name === "ProviderHome") return true;
      
      // Check if current route starts with the menu route pattern
      return route.name?.includes(menuRoute.replace('Provider', '')) || 
             route.name === menuRoute;
    };

    // Use router navigation instead of tab switching
    const goTo = (menuKey) => {
      const targetRoute = menuItems[menuKey]?.route;
      if (targetRoute) {
        console.log(`🔄 Navigating to: ${targetRoute}`);
        router.push({ name: targetRoute });
      }
      sidebarOpen.value = false;
    };

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const logout = async () => {
      loggingOut.value = true;
      localStorage.clear();
      await router.push({ name: "Login" });
      loggingOut.value = false;
    };

    // Force fresh profile fetch (bypass 304 cache)
    const fetchProvider = async () => {
      const token = localStorage.getItem("provider_token");
      if (!token) return router.push({ name: "Login" });

      try {
        const res = await http.get("/users/profile", {
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        
        console.log("✅ Fresh profile data:", res.data);
        
        provider.value = res.data;
        if (res.data._id) {
          localStorage.setItem("provider_id", res.data._id);
        }
      } catch (err) {
        console.error("Profile load failed:", err.response?.data || err.message);
        localStorage.clear();
        router.push({ name: "Login" });
      }
    };

    // Watch for route changes to update active state
    watch(() => route.name, (newRoute) => {
      console.log('📍 Route changed to:', newRoute);
    });

    onMounted(() => {
      fetchProvider();
      console.log('🎯 Dashboard mounted, current route:', route.name);
    });

    const handleProfileUpdated = () => {
      fetchProvider(); // Refresh after update
    };

    // Return all reactive data and methods
    return {
      loggingOut,
      provider,
      sidebarOpen,
      menuItems,
      isActiveRoute,
      goTo,
      toggleSidebar,
      logout,
      handleProfileUpdated
    };
  }
};
</script>

<style scoped>
/* ===== BASE ===== */
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Poppins', sans-serif;
  overflow-x: hidden;
}

/* ===== MOBILE HEADER ===== */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  background: linear-gradient(90deg, #0066cc, #0088ff);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.hamburger-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.7rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 8px;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mobile-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.header-spacer {
  width: 28px;
}

/* ===== SIDEBAR ===== */
.dashboard-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 300px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 4px 0 25px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 90;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.dashboard-sidebar.sidebar-open {
  transform: translateX(0);
}

.sidebar-inner {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 1.6rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.logo-icon {
  font-size: 1.9rem;
}

.sidebar-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #0066cc, #00a8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(230, 245, 255, 0.7);
  border-radius: 16px;
  padding: 1.1rem;
  margin: 1.2rem 0 1.6rem;
  border: 1px solid rgba(200, 230, 255, 0.8);
}

.user-icon {
  font-size: 1.7rem;
  color: #0077cc;
}

.welcome-text {
  display: flex;
  flex-direction: column;
}

.welcome-label {
  font-size: 0.87rem;
  color: #4a6cb7;
  font-weight: 500;
}

.welcome-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #005599;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Nav */
.sidebar-nav {
  flex: 1;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.sidebar-menu li {
  padding: 1rem 1.4rem;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 600;
  font-size: 1.05rem;
  color: #2c3e50;
  transition: all 0.25s ease;
}

.sidebar-menu li i {
  width: 24px;
  text-align: center;
  font-size: 1.2rem;
  color: #4a6cb7;
}

.sidebar-menu li:hover {
  background: rgba(0, 119, 255, 0.1);
  color: #0066cc;
  transform: translateX(4px);
}

.sidebar-menu li.active {
  background: linear-gradient(90deg, #0066cc, #0095ff);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.sidebar-menu li.active i {
  color: white;
}

/* Footer */
.sidebar-footer {
  padding: 1.2rem 1.2rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.logout-btn {
  background: linear-gradient(90deg, #ff3b3b, #ff6b6b);
  color: white;
  padding: 0.95rem;
  border: none;
  border-radius: 16px;
  width: 100%;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(255, 60, 60, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.logout-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 60, 60, 0.4);
}

/* Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 80;
}

/* Main Content */
.dashboard-main {
  flex: 1;
  padding: 1.8rem 1.4rem 2rem;
  padding-top: 80px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);
}

/* Fallback */
.fallback-content {
  background: white;
  padding: 2rem;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  text-align: center;
  margin: 2rem 0;
}
</style>