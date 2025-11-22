<!-- src/pages/Providers/Services/ServicesSection.vue -->
<template>
  <div class="services-section">
    <div class="section-header">
      <h1 class="section-title">My Services</h1>
      <p class="section-subtitle">Manage your service offerings and availability</p>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>{{ errorMessage }}</span>
      <button class="close-error" @click="errorMessage = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <i class="fa-solid fa-circle-check"></i>
      <span>{{ successMessage }}</span>
      <button class="close-success" @click="successMessage = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- NEW: Status Summary -->
    <div class="status-summary">
      <div class="status-item">
        <span class="status-count total">{{ services.length }}</span>
        <span class="status-label">Total Services</span>
      </div>
      <div class="status-item">
        <span class="status-count active">{{ activeServicesCount }}</span>
        <span class="status-label">Active</span>
      </div>
      <div class="status-item">
        <span class="status-count draft">{{ draftServicesCount }}</span>
        <span class="status-label">Draft</span>
      </div>
    </div>

    <div v-if="showTimeSlotsModal && selectedService" class="modal-overlay">
      <div class="modal-content">
        <TimeSlots
          :service="selectedService"
          :serviceId="getServiceId(selectedService)"
          @saved="handleTimeSlotsSaved"
          @close="closeTimeSlots"
        />
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-bar">
      <div class="search-filter">
        <div class="search-input">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search services..."
          />
        </div>
        <!-- NEW: Status Filter -->
        <div class="status-filter">
          <select v-model="statusFilter" class="form-control">
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="draft">Draft Only</option>
          </select>
        </div>
      </div>
      <button class="btn add-service-btn" @click="openForm(null)">
        <i class="fa-solid fa-plus"></i> Add New Service
      </button>
      <button class="btn debug-btn" @click="debugMode = !debugMode">
        <i class="fa-solid fa-bug"></i> {{ debugMode ? 'Hide Debug' : 'Show Debug' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Loading your services...</p>
      <p v-if="debugMode" class="debug-info">Fetching from backend...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="services.length === 0" class="empty-state">
      <i class="fa-solid fa-box-open"></i>
      <h3>No services found</h3>
      <p>You haven't added any services yet.<br />Start by creating your first service!</p>
      <button class="btn primary-btn" @click="openForm(null)">Create Service</button>
    </div>

    <!-- Services Grid - Hidden when TimeSlots is open -->
    <div v-else-if="!showTimeSlots" class="services-grid">
      <div
        v-for="service in filteredServices"
        :key="getServiceKey(service)"
        class="service-card"
        :class="{ 'draft-service': getServiceStatus(service) === 'draft' }"
      >
        <!-- NEW: Status Badge -->
        <div class="service-status-badge" :class="getServiceStatus(service)">
          {{ getServiceStatus(service) === 'draft' ? 'Draft' : 'Active' }}
        </div>

        <!-- Banner -->
        <div class="card-banner">
          <img
            v-if="service?.banner"
            :src="service.banner"
            :alt="service?.title || 'Service'"
            class="banner-img"
          />
          <div v-else class="banner-placeholder">
            <i class="fa-solid fa-scissors"></i>
          </div>
        </div>

        <!-- Content -->
        <div class="card-content">
          <!-- View Mode - DEFAULT -->
          <div class="view-mode">
            <div class="card-header">
              <h3 class="service-title">{{ service?.title || 'Untitled Service' }}</h3>
              <div class="category-tag">
                {{ getCategoryName(service?.categoryId || service?.category) }}
              </div>
              <!-- Debug: Show Service ID -->
              <div class="service-id-debug" v-if="debugMode">
                <small>ID: {{ getServiceId(service) || 'No ID' }}</small>
                <small>Status: {{ getServiceStatus(service) }}</small>
              </div>
            </div>
            <p class="service-description">
              {{ service?.description || 'No description available' }}
            </p>

            <!-- Provider Contact Information -->
            <div class="provider-info-section">
              <h4>Provider Information</h4>
              <div class="provider-details">
                <div class="provider-detail" v-if="service?.location">
                  <i class="fa-solid fa-location-dot"></i>
                  <span>{{ service.location }}</span>
                </div>
                <div class="provider-detail" v-if="service?.email">
                  <i class="fa-solid fa-envelope"></i>
                  <span>{{ service.email }}</span>
                </div>
                <div class="provider-detail" v-if="service?.phone">
                  <i class="fa-solid fa-phone"></i>
                  <span>{{ service.phone }}</span>
                </div>
                <div class="provider-detail" v-if="service?.experience">
                  <i class="fa-solid fa-briefcase"></i>
                  <span>{{ service.experience }} experience</span>
                </div>
              </div>
            </div>

            <div class="service-meta">
              <div class="price">
                <span class="total-price">{{ service?.totalPrice || 0 }} ETB</span>
                <span v-if="service?.bookingPrice" class="booking-price">({{ service.bookingPrice }} ETB deposit)</span>
              </div>
              <div class="payment" v-if="service?.paymentMethod">
                <i class="fa-solid fa-wallet"></i> {{ service.paymentMethod }}
              </div>
            </div>

            <!-- Availability Summary -->
            <div class="availability-summary">
              <template v-if="getServiceStatus(service) === 'active'">
                <span class="availability-badge" :class="{ available: hasAnyRealAvailability(service) }">
                  {{ hasAnyRealAvailability(service) ? 'Available' : 'Not Available' }}
                </span>
                <span class="days-count" v-if="hasAnyRealAvailability(service)">
                  ({{ getAvailableDaysCount(service) }} days)
                </span>
                
                <!-- Manage Time Slots Button -->
                <div class="manage-slots-section">
                  <button class="btn manage-slots-btn" @click="openTimeSlots(service)">
                    <i class="fa-solid fa-calendar-edit"></i> Manage Time Slots
                  </button>
                </div>
              </template>
              
              <template v-else>
                <!-- DRAFT SERVICE: Add Time Slots Button -->
                <div class="draft-actions">
                  <div class="draft-notice">
                    <i class="fa-solid fa-clock"></i>
                    <span>Add time slots to activate service</span>
                  </div>
                  <button class="btn add-slots-btn" @click="openTimeSlots(service)">
                    <i class="fa-solid fa-calendar-plus"></i> Add Time Slots
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Edit Mode - Only show when editing this specific service -->
          <div v-if="editingServiceId === getServiceId(service)" class="edit-mode">
            <div class="edit-header">
              <h3>Edit Service</h3>
              <button class="btn cancel-btn" @click="cancelEdit()">
                Cancel
              </button>
            </div>

            <!-- Title -->
            <div class="form-group">
              <label>Title</label>
              <input
                v-model="editingServiceData.title"
                type="text"
                class="form-control"
                placeholder="Service title"
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea
                v-model="editingServiceData.description"
                class="form-control"
                rows="4"
                placeholder="Service description"
              ></textarea>
            </div>

            <!-- Pricing -->
            <div class="form-group">
              <label>Total Price (ETB)</label>
              <input
                v-model.number="editingServiceData.totalPrice"
                type="number"
                class="form-control"
                min="0"
                step="1"
              />
            </div>
            <div class="form-group">
              <label>Booking Deposit (ETB)</label>
              <input
                v-model.number="editingServiceData.bookingPrice"
                type="number"
                class="form-control"
                min="0"
                step="1"
              />
            </div>

            <!-- Payment Method -->
            <div class="form-group">
              <label>Payment Method</label>
              <select v-model="editingServiceData.paymentMethod" class="form-control">
                <option value="">Select payment method</option>
                <option value="Telebirr">Telebirr</option>
                <option value="Chapa">Chapa</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>

            <!-- Provider Contact Information -->
            <div class="form-group">
              <h4>Provider Information</h4>
              <div class="provider-info-edit">
                <div class="form-group">
                  <label>Location</label>
                  <input
                    v-model="editingServiceData.location"
                    type="text"
                    class="form-control"
                    placeholder="Service location"
                  />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input
                    v-model="editingServiceData.email"
                    type="email"
                    class="form-control"
                    placeholder="Provider email"
                  />
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input
                    v-model="editingServiceData.phone"
                    type="text"
                    class="form-control"
                    placeholder="Provider phone"
                  />
                </div>
                <div class="form-group">
                  <label>Experience</label>
                  <input
                    v-model="editingServiceData.experience"
                    type="text"
                    class="form-control"
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>
            </div>

            <!-- NEW: Service Status Display -->
            <div class="form-group">
              <label>Service Status</label>
              <div class="status-display">
                <span class="status-badge" :class="getServiceStatus(editingServiceData)">
                  {{ getServiceStatus(editingServiceData) === 'draft' ? 'Draft' : 'Active' }}
                </span>
                <p class="status-note" v-if="getServiceStatus(editingServiceData) === 'draft'">
                  <i class="fa-solid fa-info-circle"></i>
                  Service will become active when you add time slots
                </p>
              </div>
            </div>

            <!-- Quick Availability Toggle (Simple version) -->
            <div class="form-group">
              <h4>Quick Availability</h4>
              <div class="quick-availability">
                <label class="availability-toggle">
                  <input
                    type="checkbox"
                    :checked="hasAnyRealAvailability(editingServiceData)"
                    @change="toggleQuickAvailability($event.target.checked)"
                  />
                  <span class="toggle-label">Service is available for booking</span>
                </label>
                <p class="availability-note">
                  Use the "Manage Time Slots" button for detailed calendar scheduling
                </p>
              </div>
            </div>

            <!-- Save Button -->
            <div class="edit-actions">
              <button class="btn save-btn" @click="saveService()" :disabled="saving">
                <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button class="action-btn edit" @click.stop="startEdit(service)" :disabled="!getServiceId(service)">
            <i class="fa-solid fa-pen"></i> 
            Edit {{ getServiceId(service) ? '' : '(No ID)' }}
          </button>
          <button class="action-btn delete" @click.stop="confirmDelete(getServiceId(service), service?.title)" :disabled="!getServiceId(service)">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
          <button class="action-btn preview" @click.stop="previewService(getServiceId(service))" :disabled="!getServiceId(service) || getServiceStatus(service) === 'draft'">
            <i class="fa-solid fa-eye"></i> Preview
            <span v-if="getServiceStatus(service) === 'draft'" class="preview-disabled-tooltip">(Active only)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Time Slots Overlay - Slides down when active -->
    <transition name="slide-down">
      <div v-if="showTimeSlots" class="time-slots-overlay">
        <!-- DEBUG VISUAL INDICATOR -->
        <div style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999; font-weight: bold;">
          🚀 DEBUG: TimeSlots Overlay VISIBLE
        </div>

        <div class="time-slots-header">
          <button class="btn back-btn" @click="closeTimeSlots">
            <i class="fa-solid fa-arrow-left"></i> Back to Services
          </button>
          <h2 class="time-slots-title">
            {{ getServiceStatus(selectedService) === 'draft' ? 'Add Time Slots' : 'Manage Time Slots' }}
          </h2>
          <p class="time-slots-subtitle" v-if="selectedService">
            for {{ selectedService.title }}
            <span class="service-status-indicator" :class="getServiceStatus(selectedService)">
              ({{ getServiceStatus(selectedService) === 'draft' ? 'Draft' : 'Active' }})
            </span>
          </p>
        </div>

        <!-- TimeSlots Component -->
        <TimeSlots 
          v-if="selectedService && showTimeSlots"
          :service="selectedService"
          :serviceId="getServiceId(selectedService)"
          @close="closeTimeSlots"
          @saved="handleTimeSlotsSaved"
        />
      </div>
    </transition>

    <!-- Debug Panel -->
    <div v-if="debugMode && !showTimeSlots" class="debug-panel">
      <h4>Debug Information</h4>
      <p>Total Services: {{ services.length }}</p>
      <p>Active Services: {{ activeServicesCount }}</p>
      <p>Draft Services: {{ draftServicesCount }}</p>
      <p>Services with IDs: {{ services.filter(s => getServiceId(s)).length }}</p>
      <p>Loading: {{ loading }}</p>
      <p>Last Error: {{ lastError }}</p>
      <div v-for="(service, index) in services" :key="index">
        Service {{ index }}: "{{ service?.title || 'NULL SERVICE' }}" - 
        ID: {{ getServiceId(service) || 'MISSING' }} - 
        Status: {{ getServiceStatus(service) }}
      </div>
    </div>

    <!-- Service Form Modal -->
    <transition name="modal-fade">
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal service-form-modal" @click.stop>
          <div class="modal-header">
            <h2>{{ editingService ? 'Edit Service' : 'Create New Service' }}</h2>
            <button class="close-btn" @click="closeForm" aria-label="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <ServiceForm
            :service="editingService"
            @save="onServiceSaved"
            @close="closeForm"
          />
        </div>
      </div>
    </transition>

    <!-- Delete Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal delete-modal" @click.stop>
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete "<strong>{{ serviceToDeleteTitle }}</strong>"? This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn cancel-btn" @click="showDeleteConfirm = false">Cancel</button>
            <button class="btn delete-btn" @click="deleteService" :disabled="deleting">
              <i v-if="deleting" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-trash"></i>
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
  </template>
<script>
import ServiceForm from './ServiceForm.vue';
import TimeSlots from './TimeSlots.vue';
import http from "@/api/index.js";

export default {
  name: 'ServicesSection',
  components: { ServiceForm, TimeSlots },
  data() {
    return {
      services: [],
      categories: [],
      loading: false,
      showForm: false,
      editingService: null,
      editingServiceId: null,
      editingServiceData: null,
      searchQuery: '',
      statusFilter: 'all',
      showDeleteConfirm: false,
      serviceToDelete: null,
      serviceToDeleteTitle: '',
      deleting: false,
      saving: false,
      errorMessage: '',
      successMessage: '',
      debugMode: false,
      lastError: null,
      showTimeSlotsModal: false,
      selectedService: null,
      selectedServiceId: null, // ADD THIS
      daysOfWeek: [
        { key: 'monday', name: 'monday', label: 'Monday' },
        { key: 'tuesday', name: 'tuesday', label: 'Tuesday' },
        { key: 'wednesday', name: 'wednesday', label: 'Wednesday' },
        { key: 'thursday', name: 'thursday', label: 'Thursday' },
        { key: 'friday', name: 'friday', label: 'Friday' },
        { key: 'saturday', name: 'saturday', label: 'Saturday' },
        { key: 'sunday', name: 'sunday', label: 'Sunday' }
      ]
    };
  },

  computed: {
    filteredServices() {
      let result = this.services.filter(service => service != null);
      
      if (this.statusFilter !== 'all') {
        result = result.filter(s => this.getServiceStatus(s) === this.statusFilter);
      }
      
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        result = result.filter(s =>
          (s?.title || '').toLowerCase().includes(q) ||
          (s?.description || '').toLowerCase().includes(q) ||
          this.getCategoryName(s?.categoryId || s?.category).toLowerCase().includes(q)
        );
      }
      return result;
    },

    activeServicesCount() {
      return this.services.filter(s => this.getServiceStatus(s) === 'active').length;
    },

    draftServicesCount() {
      return this.services.filter(s => this.getServiceStatus(s) === 'draft').length;
    },

    showTimeSlots() {
      return this.showTimeSlotsModal;
    }
  },

  async created() {
    await this.fetchCategories();
    await this.fetchServices();
  },

  methods: {
    // ✅ Service Status Detection
    getServiceStatus(service) {
      if (!service) return 'draft';
      
      if (!service.slots || !Array.isArray(service.slots) || service.slots.length === 0) {
        return 'draft';
      }
      
      const hasRealSlots = service.slots.some(slot => {
        if (!slot) return false;
        
        if (slot.weeklySchedule && Array.isArray(slot.weeklySchedule)) {
          return slot.weeklySchedule.some(week => 
            week && 
            week.timeSlots && 
            Array.isArray(week.timeSlots) && 
            week.timeSlots.length > 0
          );
        }
        
        return false;
      });
      
      return hasRealSlots ? 'active' : 'draft';
    },

    // ✅ Real Availability Check
    hasAnyRealAvailability(service) {
      return this.getServiceStatus(service) === 'active';
    },

    // ✅ Available Days Count
    getAvailableDaysCount(service) {
      if (this.getServiceStatus(service) !== 'active') return 0;
      if (!service.slots || !Array.isArray(service.slots)) return 0;
      
      const daysWithSlots = new Set();
      
      service.slots.forEach(slot => {
        if (slot && slot.weeklySchedule) {
          slot.weeklySchedule.forEach(week => {
            if (week && week.timeSlots && week.timeSlots.length > 0) {
              daysWithSlots.add(week.day);
            }
          });
        }
      });
      
      return daysWithSlots.size;
    },

    // ✅ FIXED: Open TimeSlots with proper service ID
    openTimeSlots(service) {
      console.log('🚀 Opening TimeSlots for:', service?.title);
      this.selectedService = service;
      this.selectedServiceId = this.getServiceId(service); // SET THE SERVICE ID
      this.showTimeSlotsModal = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    closeTimeSlots() {
      this.showTimeSlotsModal = false;
      this.selectedService = null;
      this.selectedServiceId = null;
    },

    // ✅ Handle time slots saved
    async handleTimeSlotsSaved(result) {
      console.log('🔄 Time slots saved successfully');
      
      try {
        await this.fetchServices();
        this.showNotification('Time slots saved successfully!', 'success');
      } catch (error) {
        console.error('❌ Error handling time slots save:', error);
        this.showNotification('Time slots saved successfully!', 'success');
      } finally {
        this.closeTimeSlots();
      }
    },

    // Notification helper method
    showNotification(message, type = 'info') {
      const notificationEl = document.createElement('div');
      notificationEl.className = `global-notification global-notification-${type}`;
      notificationEl.textContent = message;
      notificationEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        word-wrap: break-word;
      `;
      
      document.body.appendChild(notificationEl);
      
      setTimeout(() => {
        if (document.body.contains(notificationEl)) {
          document.body.removeChild(notificationEl);
        }
      }, 4000);
    },

    // Service ID methods
    getServiceId(service) {
      if (!service) return null;
      return service.serviceId || service._id || service.id || null;
    },

    getServiceKey(service) {
      if (!service) return Math.random();
      return this.getServiceId(service) || service.title || Math.random();
    },

    setError(message) {
      this.errorMessage = message;
      this.lastError = message;
      setTimeout(() => { this.errorMessage = ''; }, 5000);
    },

    setSuccess(message) {
      this.successMessage = message;
      setTimeout(() => { this.successMessage = ''; }, 3000);
    },

    closeForm() {
      this.showForm = false;
      this.editingService = null;
    },

    async fetchCategories() {
      try {
        const res = await http.get("/categories");
        this.categories = res.data;
      } catch (err) {
        console.warn("Failed to load categories for display");
      }
    },

    getCategoryName(idOrName) {
      if (!idOrName) return "Uncategorized";
      if (typeof idOrName === 'string' && /[a-zA-Z]/.test(idOrName)) {
        return idOrName;
      }
      const cat = this.categories.find(c => c._id === idOrName);
      return cat ? cat.name : "Unknown";
    },

    async fetchServices() {
      this.loading = true;
      this.errorMessage = '';
      this.lastError = null;
      
      try {
        const res = await http.get('/services');
        const servicesData = res.data;
        
        let processedServices = [];
        
        if (Array.isArray(servicesData)) {
          processedServices = servicesData.filter(service => 
            service != null && typeof service === 'object'
          );
        } else {
          console.warn('Unexpected services data format:', typeof servicesData);
          processedServices = [];
        }

        this.services = processedServices;
        
      } catch (err) {
        console.error("Failed to fetch services:", err);
        const errorMsg = err.response?.data?.message || err.message || "Could not load services";
        this.setError(errorMsg);
        this.services = [];
      } finally {
        this.loading = false;
      }
    },

    // Edit methods
    startEdit(service) {
      if (!service) {
        this.setError("Cannot edit service: Service data is missing");
        return;
      }
      
      const serviceId = this.getServiceId(service);
      
      if (!serviceId) {
        this.setError("This service cannot be edited (missing service ID).");
        return;
      }
      
      this.editingServiceData = JSON.parse(JSON.stringify(service));
      this.editingServiceId = serviceId;
      
      if (!this.editingServiceData.slots) {
        this.editingServiceData.slots = [];
      }
    },

    confirmDelete(serviceId, serviceTitle) {
      if (!serviceId) {
        this.setError("Cannot delete service: No ID found");
        return;
      }
      
      this.serviceToDelete = serviceId;
      this.serviceToDeleteTitle = serviceTitle || 'this service';
      this.showDeleteConfirm = true;
    },

    async deleteService() {
      if (!this.serviceToDelete) return;
      
      this.deleting = true;
      try {
        await http.delete(`/services/${this.serviceToDelete}`);
        await this.fetchServices();
        this.showDeleteConfirm = false;
        this.setSuccess("Service deleted successfully!");
      } catch (err) {
        console.error("Failed to delete service:", err);
        const msg = err.response?.data?.message || err.message || "Failed to delete service";
        this.setError(msg);
      } finally {
        this.deleting = false;
        this.serviceToDelete = null;
        this.serviceToDeleteTitle = '';
      }
    },

    async saveService() {
      if (!this.editingServiceData || !this.editingServiceId) {
        this.setError("No service data to save.");
        return;
      }

      this.saving = true;
      try {
        const serviceData = {
          title: String(this.editingServiceData.title || '').trim(),
          description: String(this.editingServiceData.description || '').trim(),
          totalPrice: Math.max(0, Number(this.editingServiceData.totalPrice) || 0),
          bookingPrice: Math.max(0, Number(this.editingServiceData.bookingPrice) || 0),
          paymentMethod: String(this.editingServiceData.paymentMethod || 'Telebirr'),
          serviceType: String(this.editingServiceData.serviceType || 'fixed'),
          priceUnit: String(this.editingServiceData.priceUnit || 'ETB'),
          location: String(this.editingServiceData.location || ''),
          email: String(this.editingServiceData.email || ''),
          phone: String(this.editingServiceData.phone || ''),
          experience: String(this.editingServiceData.experience || '')
        };

        if (this.editingServiceData.categoryId && this.editingServiceData.categoryId.length > 5) {
          serviceData.categoryId = String(this.editingServiceData.categoryId);
        }

        if (this.editingServiceData.slots && Array.isArray(this.editingServiceData.slots)) {
          serviceData.slots = this.editingServiceData.slots;
        } else {
          serviceData.slots = [];
        }

        await http.put(`/services/${this.editingServiceId}`, serviceData);
        this.setSuccess("Service updated successfully!");

        this.editingServiceId = null;
        this.editingServiceData = null;
        await this.fetchServices();
        
      } catch (err) {
        console.error('Save failed:', err);
        let errorMessage = "Failed to save service";
        
        if (err.response?.status === 500) {
          errorMessage = "Backend server error. The service might be temporarily unavailable.";
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = "Request timeout. Please try again.";
        } else if (err.response?.data?.message) {
          errorMessage = `Backend error: ${err.response.data.message}`;
        } else if (err.message) {
          errorMessage = `Error: ${err.message}`;
        }
        
        this.setError(errorMessage);
      } finally {
        this.saving = false;
      }
    },

    openForm(service) {
      this.editingService = service ? { ...service } : null;
      this.showForm = true;
    },

    async onServiceSaved(savedService) {
      await this.fetchServices();
      this.closeForm();
      this.setSuccess("Service saved successfully! Now add time slots to activate it.");
    },

    previewService(serviceId) {
      if (!serviceId) {
        this.setError("Service ID not available for preview.");
        return;
      }
      this.$router.push(`/provider/services/${serviceId}`);
    },

    cancelEdit() {
      this.editingServiceId = null;
      this.editingServiceData = null;
    },

    // Quick availability toggle
    toggleQuickAvailability(isAvailable) {
      if (!this.editingServiceData) return;
      
      if (isAvailable) {
        if (!this.editingServiceData.slots || this.editingServiceData.slots.length === 0) {
          this.editingServiceData.slots = [{
            dayOfWeek: 'monday',
            slotLabel: 'Default Schedule',
            isActive: true,
            weeklySchedule: [{
              day: 'monday',
              isWorkingDay: true,
              timeSlots: [
                { startTime: "09:00", endTime: "17:00", isAvailable: true }
              ]
            }]
          }];
        }
      } else {
        this.editingServiceData.slots = [];
      }
    }
  }
};
</script>
<style scoped>
/* Add modal styles if you don't have them */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  position: relative;
}

.status-item {
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 120px;
}

.status-count {
  font-size: 2rem;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}

.status-count.total {
  color: #6b7280;
}

.status-count.active {
  color: #22c55e;
}

.status-count.draft {
  color: #f59e0b;
}

.status-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
}

/* NEW: Status Filter */
.status-filter {
  min-width: 150px;
}

/* NEW: Service Status Badge */
.service-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.service-status-badge.draft {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #f59e0b;
}

.service-status-badge.active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #22c55e;
}

/* NEW: Draft Service Styling */
.draft-service {
  border: 2px dashed #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.draft-service .card-content {
  background: transparent;
}

/* NEW: Draft Actions */
.draft-actions {
  text-align: center;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px dashed #f59e0b;
}

.draft-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #d97706;
  font-weight: 600;
  font-size: 0.9rem;
}

.add-slots-btn {
  background: linear-gradient(120deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.add-slots-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

/* NEW: Status Display in Edit Mode */
.status-display {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  margin-bottom: 8px;
}

.status-badge.draft {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-note {
  color: #64748b;
  font-size: 0.85rem;
  margin: 8px 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* NEW: Service Status Indicator in TimeSlots */
.service-status-indicator {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.service-status-indicator.draft {
  background: #fef3c7;
  color: #d97706;
}

.service-status-indicator.active {
  background: #dcfce7;
  color: #166534;
}

/* NEW: Preview Disabled Tooltip */
.preview-disabled-tooltip {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-left: 4px;
}

/* KEEP ALL EXISTING STYLES BELOW - NO CHANGES */

/* ✅ NEW: Slide-down animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* ✅ NEW: TimeSlots overlay styles */
.time-slots-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.time-slots-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 1001;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.time-slots-title {
  font-size: 1.8rem;
  color: #0f172a;
  margin: 10px 0 5px 0;
  text-align: center;
}

.time-slots-subtitle {
  color: #64748b;
  text-align: center;
  margin: 0;
}

.back-btn {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  background: #e2e8f0;
}

/* ✅ NEW: Manage Time Slots Button Styles */
.manage-slots-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.manage-slots-btn {
  background: linear-gradient(120deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.manage-slots-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* ✅ NEW: Quick Availability Styles */
.quick-availability {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.availability-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  margin-bottom: 8px;
}

.availability-toggle input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.toggle-label {
  font-size: 1rem;
}

.availability-note {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0;
  font-style: italic;
}

/* Remove old time slot editing styles since they're moved to TimeSlots.vue */
.slot-edit-item,
.slot-time-inputs,
.time-input,
.btn-remove-slot,
.time-slots-container,
.slots-list,
.time-separator,
.btn-add-slot,
.day-edit-row,
.day-header,
.day-toggle,
.day-label,
.off-label {
  /* These styles are no longer needed in ServicesSection */
}

/* Keep all your existing main styles below... */

.services-section {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Poppins", sans-serif;
}

.section-header {
  text-align: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 2.2rem;
  color: #0f172a;
  margin-bottom: 12px;
}

.section-subtitle {
  color: #64748b;
  font-size: 1.1rem;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.search-filter {
  display: flex;
  gap: 16px;
  flex: 1;
  max-width: 500px;
}

.search-input {
  position: relative;
  flex: 1;
}

.search-input i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
}

.add-service-btn {
  background: linear-gradient(120deg, #22c55e, #16a34a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.add-service-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-state i, .empty-state i {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #334155;
  margin-bottom: 12px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 24px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.primary-btn {
  background: #22c55e;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 28px;
}

.service-card {
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.service-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}

.card-banner {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, #f0fdf4, #dcfce7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  font-size: 3rem;
}

.card-content {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.service-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  flex: 1;
}

.category-tag {
  background: #f1f5f9;
  color: #475569;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.service-description {
  color: #475569;
  line-height: 1.5;
  margin-bottom: 16px;
  min-height: 48px;
}

.service-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.price .total-price {
  font-weight: 700;
  color: #0f172a;
  font-size: 1.2rem;
}

.price .booking-price {
  color: #64748b;
  font-size: 0.9rem;
  margin-left: 8px;
}

.payment {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.95rem;
}

/* Provider Info Styles */
.provider-info-section {
  margin: 16px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.provider-info-section h4 {
  margin-bottom: 12px;
  color: #334155;
  font-size: 1.1rem;
}

.provider-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.provider-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
}

.provider-detail i {
  width: 16px;
  color: #64748b;
}

.provider-info-edit {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* Availability Summary */
.availability-summary {
  margin: 16px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.availability-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
}

.availability-badge.available {
  background: #dcfce7;
  color: #166534;
}

.availability-badge:not(.available) {
  background: #fef2f2;
  color: #991b1b;
}

.days-count {
  color: #64748b;
  font-size: 0.85rem;
  margin-left: 8px;
}

/* Enhanced Edit Mode Styles */
.edit-mode {
  background: #f8fafc;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  margin-top: 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.edit-actions {
  margin-top: 20px;
  text-align: center;
}

.save-btn {
  background: #16a34a;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 200px;
}

.save-btn:hover {
  background: #15803d;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 200px;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.card-actions {
  display: flex;
  padding: 0 20px 20px;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  font-size: 0.95rem;
}

.action-btn.edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.action-btn.edit:hover {
  background: #bfdbfe;
}

.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.action-btn.preview {
  background: #f5f5f5;
  color: #333;
}

.action-btn.preview:hover {
  background: #e0e0e0;
}

/* Error and Success Messages */
.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: #efe;
  border: 1px solid #cfc;
  color: #363;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-error, .close-success {
  background: none;
  border: none;
  color: inherit;
  margin-left: auto;
  cursor: pointer;
}

/* Debug styles */
.debug-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-id-debug {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.7rem;
  margin-top: 4px;
}

.debug-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  font-family: monospace;
  font-size: 0.9rem;
}

.debug-panel h4 {
  color: #64748b;
  margin-bottom: 8px;
}

.debug-info {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 8px;
}

/* Modals */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.service-form-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #0f172a;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: #f1f5f9;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  font-size: 1.2rem;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.delete-modal h3 {
  margin: 0 0 16px;
  font-size: 1.5rem;
  color: #0f172a;
}

.delete-modal p {
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 16px;
}

.cancel-btn {
  flex: 1;
  background: #f1f5f9;
  color: #475569;
  padding: 14px;
  border-radius: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.delete-btn {
  flex: 1;
  background: #ef4444;
  color: white;
  padding: 14px;
  border-radius: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .status-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .status-item {
    min-width: auto;
    padding: 12px;
  }
  
  .status-count {
    font-size: 1.5rem;
  }

  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filter {
    flex-direction: column;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .modal {
    width: 95%;
    max-width: none;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }

  .time-slots-overlay {
    padding: 15px;
  }

  .time-slots-header {
    padding: 15px;
  }

  .time-slots-title {
    font-size: 1.5rem;
  }
}
</style>