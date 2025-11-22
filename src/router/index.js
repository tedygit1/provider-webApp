// src/router/index.js
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
import Login from "@/pages/Auth/Login.vue";
import Register from "@/pages/Auth/Register.vue";
import ForgotPassword from "@/pages/Auth/ForgotPassword.vue";
import AuthTest from "@/pages/AuthTest.vue";
import ResetPassword from "@/pages/Auth/ResetPassword.vue";

// Provider Dashboard
import Dashboard from "@/pages/Providers/Dashboard.vue";
import HomeDashboard from "@/pages/Providers/HomeDashboard.vue";
import ProfileSection from "@/pages/Providers/ProfileSection.vue";
import ServicesSection from "@/pages/Providers/Services/ServicesSection.vue";
import BookingsSection from "@/pages/Providers/BookingsSection.vue";
import EarningsSection from "@/pages/Providers/EarningsSection.vue";
import MessagesSection from "@/pages/Providers/MessagesSection.vue";
import AnalyticsSection from "@/pages/Providers/AnalyticsSection.vue";
import ReviewsSection from "@/pages/Providers/ReviewsSection.vue";
import SettingsSection from "@/pages/Providers/SettingsSection.vue";

// Footer pages
import HelpCenter from "@/pages/Footer/HelpCenter.vue";
import PrivacyPolicy from "@/pages/Footer/PrivacyPolicy.vue";
import TermsOfService from "@/pages/Footer/TermsOfService.vue";
import Feedback from "@/pages/Footer/Feedback.vue";

const routes = [
  { path: "/auth-test", name: "AuthTest", component: AuthTest },

  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", name: "Home", component: Home },
      { path: "about", name: "About", component: About },
      { path: "contact", name: "Contact", component: Contact },
      { path: "how-it-works", name: "HowItWorks", component: HowItWorks },
      { path: "providers", name: "Providers", component: ProvidersPage },
      { path: "login", name: "Login", component: Login },
      { path: "register", name: "Register", component: Register },
      { path: "forgot-password", name: "ForgotPassword", component: ForgotPassword },
      { path: "reset-password/:token", name: "ResetPassword", component: ResetPassword },

      // Footer pages
      { path: "help-center", name: "HelpCenter", component: HelpCenter },
      { path: "privacy-policy", name: "PrivacyPolicy", component: PrivacyPolicy },
      { path: "terms-of-service", name: "TermsOfService", component: TermsOfService },
      { path: "feedback", name: "Feedback", component: Feedback },
    ],
  },

  // Provider Dashboard
  {
    path: "/provider",
    component: Dashboard,
    meta: { requiresProvider: true },
    children: [
      { path: "", redirect: "/provider/home" },
      { path: "home", name: "ProviderHome", component: HomeDashboard },
      { path: "profile", name: "ProviderProfile", component: ProfileSection },
      { path: "services", name: "ProviderServices", component: ServicesSection },
      { path: "services/:id", name: "ServiceDetails", component: () => import("@/pages/Providers/Services/ServiceDetails.vue") },
      // ✅ CAREFULLY ADDED: TimeSlots route - placed right after ServiceDetails for logical grouping
      { 
        path: "services/:id/time-slots", 
        name: "TimeSlots", 
        component: () => import("@/pages/Providers/Services/TimeSlots.vue"),
        props: true 
      },
      { path: "bookings", name: "ProviderBookings", component: BookingsSection },
      { path: "earnings", name: "ProviderEarnings", component: EarningsSection },
      { path: "messages", name: "ProviderMessages", component: MessagesSection },
      { path: "analytics", name: "ProviderAnalytics", component: AnalyticsSection },
      { path: "reviews", name: "ProviderReviews", component: ReviewsSection },
      { path: "settings", name: "ProviderSettings", component: SettingsSection },
    ],
  },

  // 404 fallback
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// Auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("provider_token");
  const provider = localStorage.getItem("loggedProvider");

  if (to.meta.requiresProvider && (!token || !provider)) {
    return next({ name: "Login" });
  }

  if ((to.name === "Login" || to.name === "Register") && token && provider) {
    return next({ name: "ProviderHome" });
  }

  next();
});

export default router;