import { createRouter, createWebHistory } from "vue-router";

// Layout
import MainLayout from "@/Layouts/MainLayout.vue";

// General pages
import Home from "@/pages/Home.vue";
import About from "@/pages/About.vue";
import Contact from "@/pages/Contact.vue";
import HowItWorks from "@/pages/HowItWorks.vue";
import ProvidersPage from "@/pages/Providers.vue";

// Auth pages
import Login from "@/pages/auth/Login.vue";
import Register from "@/pages/auth/Register.vue";
import ForgotPassword from "@/pages/auth/ForgotPassword.vue";
import AuthTest from "@/pages/AuthTest.vue";

// Provider Dashboard + children
import Dashboard from "@/pages/providers/Dashboard.vue";
import HomeDashboard from "@/pages/providers/HomeDashboard.vue";
import ProfileSection from "@/pages/providers/ProfileSection.vue";

// ✅ Correct Services path (folder created)
import ServicesSection from "@/pages/providers/Services/ServicesSection.vue";

import BookingsSection from "@/pages/providers/BookingsSection.vue";
import EarningsSection from "@/pages/providers/EarningsSection.vue";
import MessagesSection from "@/pages/providers/MessagesSection.vue";
import AnalyticsSection from "@/pages/providers/AnalyticsSection.vue";
import ReviewsSection from "@/pages/providers/ReviewsSection.vue";
import SettingsSection from "@/pages/providers/SettingsSection.vue";

// Footer pages
import HelpCenter from "@/pages/Footer/HelpCenter.vue";
import PrivacyPolicy from "@/pages/Footer/PrivacyPolicy.vue";
import TermsOfService from "@/pages/Footer/TermsOfService.vue";
import Feedback from "@/pages/Footer/Feedback.vue";

const routes = [
  // --------------------------------------
  // 🔹 Minimal Auth Test  (No layout)
  // --------------------------------------
  { path: "/auth-test", name: "AuthTest", component: AuthTest, meta: { layout: false } },

  // --------------------------------------
  // 🌐 Public Pages (with MainLayout)
  // --------------------------------------
  {

  
    path: "/",
    component: MainLayout,
    children: [
      { path: "", name: "Home", component: Home },
      { path: "about", name: "About", component: About },
      { path: "contact", name: "Contact", component: Contact },
      { path: "how-it-works", name: "HowItWorks", component: HowItWorks },
      { path: "Providers", name: "Providers", component: ProvidersPage },
      { path: "login", name: "Login", component: Login },
      { path: "register", name: "Register", component: Register },
      { path: "forgot-password", name: "ForgotPassword", component: ForgotPassword },
       { path: "/reset-password/:token",
  component: () => import("@/pages/auth/ResetPassword.vue")
},

      // Footer pages
      { path: "help-center", name: "HelpCenter", component: HelpCenter },
      { path: "privacy-policy", name: "PrivacyPolicy", component: PrivacyPolicy },
      { path: "terms-of-service", name: "TermsOfService", component: TermsOfService },
      { path: "feedback", name: "Feedback", component: Feedback },
    ],
  },

  // --------------------------------------
  // 🛠️ Provider Dashboard (Protected)
  // --------------------------------------
  {
    path: "/provider",
    component: Dashboard,
    meta: { requiresProvider: true },
    children: [
      { path: "", redirect: "/provider/home" },
      { path: "home", name: "ProviderHome", component: HomeDashboard },
      { path: "profile", name: "ProviderProfile", component: ProfileSection },
      { path: "services", name: "ProviderServices", component: ServicesSection },
      { path: "bookings", name: "ProviderBookings", component: BookingsSection },
      { path: "earnings", name: "ProviderEarnings", component: EarningsSection },
      { path: "messages", name: "ProviderMessages", component: MessagesSection },
      { path: "analytics", name: "ProviderAnalytics", component: AnalyticsSection },
      { path: "reviews", name: "ProviderReviews", component: ReviewsSection },
      { path: "settings", name: "ProviderSettings", component: SettingsSection },
    ],
  },

  // Catch-all 404 redirect
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

// --------------------------------------
// ✅ ROUTER SETUP
// --------------------------------------
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// --------------------------------------
// ✅ AUTH GUARD
// --------------------------------------
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("provider_token");
  const provider = localStorage.getItem("loggedProvider");

  // ✅ If route needs provider & no login → redirect to login
  if (to.meta.requiresProvider && (!token || !provider)) {
    return next({ name: "Login" });
  }

  // ✅ Prevent logged-in providers from accessing Login/Register
  if ((to.name === "Login" || to.name === "Register") && token && provider) {
    return next({ name: "ProviderHome" });
  }

  next();
});

export default router;
