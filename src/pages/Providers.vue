<template>
  <div class="providers-page font-poppins">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>Become a Provider on Infinity-Booking</h1>
        <p>
          Connect with clients, manage bookings, and receive payments securely — all through a professional platform that grows endlessly.
        </p>
        <p>
          Join a community of trusted service providers and expand your business with complete control.
        </p>
      </div>
    </section>

    <!-- Providers Section -->
    <section class="providers-section">
      <h2 class="section-title">Our Providers</h2>

      <div class="filters">
        <input v-model="searchQuery" type="text" placeholder="Search providers..." />
        <select v-model="selectedCategory">
          <option value="">All Categories</option>
          <option value="Beauty & Salon">Beauty & Salon</option>
          <option value="Home Service">Home Service</option>
          <option value="Education & Tutoring">Education & Tutoring</option>
        </select>
      </div>

      <div class="providers-grid">
        <!-- Static placeholder cards for now -->
        <div v-for="i in 6" :key="i" class="provider-card">
          <div class="provider-image">
            <img src="https://source.unsplash.com/600x400/?person,portrait" alt="Provider" />
          </div>
          <h3>Provider Name</h3>
          <p class="type">Category</p>
          <p class="description">Short description about the provider.</p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <h2 class="section-title">Platform Features</h2>
      <div class="features-grid">
        <div class="feature-card">
          <i class="fas fa-user-check fa-2x"></i>
          <h3>Verified Providers</h3>
          <p>Ensure trust and quality with admin-approved provider profiles.</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-chart-line fa-2x"></i>
          <h3>Analytics & Insights</h3>
          <p>Track your bookings, performance, and growth trends on your dashboard.</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-hand-holding-usd fa-2x"></i>
          <h3>Secure Payments</h3>
          <p>Receive payments reliably via Telebirr, PayPal, and future card integrations.</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-comments fa-2x"></i>
          <h3>Customer Feedback</h3>
          <p>Build your reputation with ratings and reviews for better visibility.</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <h2>Ready to Join Infinity-Booking?</h2>
      <p>Create your provider account today and start growing your business in a professional network that expands endlessly.</p>
      <router-link to="/register" class="cta-btn">🚀 Sign Up / Login</router-link>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const searchQuery = ref("");
const selectedCategory = ref("");

// Temporary static array for filteredProviders logic
const providers = ref(Array(6).fill({
  name: "Provider Name",
  category: "Category",
  description: "Short description about the provider.",
  image: "https://source.unsplash.com/600x400/?person,portrait"
}));

const filteredProviders = computed(() => {
  return providers.value.filter((p) => {
    const matchesCategory = selectedCategory.value ? p.category === selectedCategory.value : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});

onMounted(() => {
  console.log("✅ Providers page loaded — backend connection placeholder");
});
</script>



<style scoped>
.hero-section {
  background: linear-gradient(to right, #3b82f6, #1e40af);
  text-align: center;
  padding: 120px 20px 80px;
  position: relative;
}
.hero-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  margin: 0 auto;
}
.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #e0f7ff;
}
.hero-content p {
  font-size: 1.15rem;
  margin-bottom: 1rem;
  line-height: 1.7;
  color: #f0f9ff;
}
.cta-btn {
  background: #ffd54f;
  color: black;
  padding: 1rem 2rem;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
  transition: transform 0.3s, background 0.3s;
}
.cta-btn:hover {
  transform: scale(1.05);
  background: #ffe082;
}
.providers-section {
  padding: 80px 20px;
  text-align: center;
}
.section-title {
  font-size: 2.2rem;
  margin-bottom: 2rem;
  color: #3b82f6;
  font-weight: 700;
}
.filters {
  margin-bottom: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}
.filters input,
.filters select {
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid #ccc;
  width: 200px;
  transition: all 0.3s;
}
.filters input:focus,
.filters select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}
.providers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  justify-content: center;
}
.provider-card {
  background: white;
  border-radius: 20px;
  width: 260px;
  padding: 20px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}
.provider-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}
.provider-card .provider-image {
  height: 180px;
  overflow: hidden;
  border-radius: 15px;
  margin-bottom: 15px;
}
.provider-card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}
.provider-card img:hover {
  transform: scale(1.05);
}
.provider-card h3 {
  font-size: 1.2rem;
  color: #3b82f6;
  margin-bottom: 5px;
}
.provider-card .type {
  font-weight: 500;
  color: #1e40af;
  margin-bottom: 8px;
}
.provider-card .description {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 10px;
}
.provider-card .badges {
  display: flex;
  justify-content: center;
  gap: 5px;
}
.badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}
.top-rated {
  background: #dcfce7;
  color: #166534;
}
.new {
  background: #fef3c7;
  color: #78350f;
}
.features-section {
  padding: 80px 20px;
  background: #f9fafb;
  text-align: center;
}
.features-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 25px;
}
.feature-card {
  background: white;
  border-radius: 20px;
  padding: 25px 20px;
  width: 220px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}
.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
.feature-card i {
  color: #3b82f6;
  margin-bottom: 12px;
}
.feature-card h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #3b82f6;
}
.feature-card p {
  font-size: 0.9rem;
  color: #555;
}
.cta-section {
  background: linear-gradient(to right, #3b82f6, #1e40af);
  color: white;
  text-align: center;
  padding: 90px 20px;
}
.loading {
  text-align: center;
  color: #3b82f6;
  font-weight: 600;
}
.error {
  color: red;
  text-align: center;
  font-weight: 600;
}
@media (max-width: 768px) {
  .providers-grid,
  .features-grid {
    flex-direction: column;
    align-items: center;
  }
  .filters input,
  .filters select {
    width: 100%;
    max-width: 300px;
  }
}
</style>
