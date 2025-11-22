<!-- src/pages/Providers/ServiceForm.vue -->
<template>
  <div class="service-form-container">
    <div class="service-form">
      <div class="form-header">
        <h2 class="form-title">{{ isEdit ? "Edit Service" : "Add New Service" }}</h2>
        <p class="form-subtitle">Fill in the basic details - you'll add time slots later</p>
      </div>

      <!-- CATEGORY -->
      <div class="form-row">
        <label>Category <span class="required">*</span></label>
        <select 
          v-model="local.categoryId" 
          @change="onCategoryChange"
          :class="{ 'error': !local.categoryId && showError }"
        >
          <option disabled value="">Choose a category</option>
          <option v-for="cat in categories" :key="cat._id" :value="cat._id">
            {{ cat.name }}
          </option>
        </select>
        <div v-if="!local.categoryId && showError" class="error-message">
          Please select a service category
        </div>
      </div>

      <!-- SUBCATEGORY -->
      <div v-if="local.categoryId && subcategories.length" class="form-row">
        <label>Subcategory</label>
        <select v-model="local.subcategoryId">
          <option disabled value="">Choose subcategory</option>
          <option v-for="sub in subcategories" :key="sub._id" :value="sub._id">
            {{ sub.name }}
          </option>
        </select>
      </div>

      <!-- SERVICE NAME -->
      <div class="form-row">
        <label>Service Name <span class="required">*</span></label>
        <input 
          type="text" 
          v-model="local.title" 
          placeholder="e.g. Men's Haircut, Legal Consultation"
          :class="{ 'error': !local.title.trim() && showError }"
          ref="titleInput"
        />
        <div v-if="!local.title.trim() && showError" class="error-message">
          A clear service name is required
        </div>
      </div>

      <!-- BANNER -->
      <div class="form-row">
        <label>Banner Image (optional)</label>
        <div class="file-upload-area" @click="$refs.fileInput.click()">
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*"
            @change="onFileChange" 
            hidden 
          />
          <div v-if="previewImage" class="image-preview-container">
            <img :src="previewImage" class="banner-preview" />
            <button class="remove-image-btn" @click.stop="removeImage" aria-label="Remove image">✕</button>
          </div>
          <div v-else class="upload-placeholder">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Upload banner (JPG/PNG)</p>
            <p class="upload-hint">Recommended: 800×400 px</p>
          </div>
        </div>
      </div>

      <!-- DESCRIPTION -->
      <div class="form-row">
        <label>Description <span class="required">*</span></label>
        <textarea 
          v-model="local.description" 
          rows="4" 
          placeholder="Describe what's included, duration, tools used, etc."
          :class="{ 'error': !local.description.trim() && showError }"
        ></textarea>
        <div v-if="!local.description.trim() && showError" class="error-message">
          A detailed description helps attract clients
        </div>
      </div>

      <!-- PRICE SECTION -->
      <div class="form-row price-section">
        <div class="price-inputs">
          <div class="price-input">
            <label>Total Price (ETB) <span class="required">*</span></label>
            <input 
              type="number" 
              v-model.number="local.totalPrice" 
              @input="updateBookingPrice"
              min="0" 
              placeholder="0"
              :class="{ 'error': local.totalPrice <= 0 && showError }"
            />
          </div>
          <div class="price-input">
            <label>Booking Deposit (10%)</label>
            <input 
              type="number" 
              v-model.number="local.bookingPrice" 
              disabled 
              readonly
            />
          </div>
        </div>
        <div v-if="local.totalPrice <= 0 && showError" class="error-message">
          Please set a valid price above 0 ETB
        </div>
      </div>

      <!-- PAYMENT METHOD -->
      <div class="form-row">
        <label>Preferred Payment Method</label>
        <select v-model="local.paymentMethod">
          <option value="">Not specified</option>
          <option v-for="pm in paymentMethods" :key="pm" :value="pm">
            {{ pm }}
          </option>
        </select>
      </div>

      <!-- STATUS - ALWAYS DRAFT FOR NEW SERVICES -->
      <div class="form-row" v-if="isEdit">
        <label>Listing Status</label>
        <div class="status-options" role="radiogroup" aria-label="Service status">
          <label class="status-option">
            <input 
              type="radio" 
              value="published" 
              v-model="local.status" 
            />
            <span class="status-label published">Published</span>
          </label>
          <label class="status-option">
            <input 
              type="radio" 
              value="draft" 
              v-model="local.status" 
            />
            <span class="status-label draft">Draft</span>
          </label>
        </div>
      </div>

      <!-- INFO MESSAGE FOR NEW SERVICES -->
      <div v-if="!isEdit" class="info-message">
        <i class="fa-solid fa-info-circle"></i>
        <p><strong>Next step:</strong> After saving, you'll add time slots to make your service available for booking.</p>
      </div>

      <!-- ACTIONS -->
      <div class="form-actions">
        <button class="btn cancel-btn" @click="$emit('close')">
          <i class="fa-solid fa-xmark"></i> Cancel
        </button>
        <button 
          class="btn save-btn" 
          @click="saveService"
          :disabled="isSaving"
        >
          <span v-if="isSaving">
            <i class="fa-solid fa-spinner fa-spin"></i> Saving...
          </span>
          <span v-else>
            <i class="fa-solid fa-check"></i> {{ isEdit ? "Update Service" : "Save as Draft" }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import http from "@/api/index.js";

export default {
  props: { service: { type: Object, default: null } },

  data() {
    return {
      local: {
        _id: null,
        categoryId: "",
        subcategoryId: "",
        title: "",
        bannerFile: null,
        description: "",
        totalPrice: 0,
        bookingPrice: 0,
        priceUnit: "ETB",
        status: "draft", // ✅ ALWAYS DRAFT FOR NEW SERVICES
        paymentMethod: "",
        slots: [] // ✅ EMPTY SLOTS - WILL BE ADDED LATER
      },
      previewImage: null,
      categories: [],
      subcategories: [],
      paymentMethods: ["Telebirr", "CBE Birr", "Cash"],
      showError: false,
      isSaving: false
    };
  },

  computed: {
    isEdit() {
      return !!(this.service && this.service._id);
    }
  },

  watch: {
    service: {
      immediate: true,
      handler(val) {
        if (val) {
          this.local = {
            _id: val._id,
            categoryId: val.categoryId || "",
            subcategoryId: val.subcategoryId || "",
            title: val.title || "",
            description: val.description || "",
            totalPrice: val.totalPrice || 0,
            bookingPrice: val.bookingPrice || 0,
            priceUnit: "ETB",
            status: val.status || "draft",
            paymentMethod: val.paymentMethod || "",
            slots: Array.isArray(val.slots) ? [...val.slots] : [],
            bannerFile: null
          };
          this.previewImage = val.banner || "";
          if (val.categoryId) {
            this.fetchSubcategories(val.categoryId);
          }
          this.updateBookingPrice();
        }
      }
    }
  },

  async mounted() {
    await this.fetchData();
    this.$nextTick(() => {
      if (this.$refs.titleInput) {
        this.$refs.titleInput.focus();
      }
    });
  },

  methods: {
    updateBookingPrice() {
      this.local.bookingPrice = Math.round(this.local.totalPrice * 0.1);
    },

    async fetchData() {
      try {
        const res = await http.get("/categories");
        this.categories = res.data;
      } catch (err) {
        console.error("Failed to load categories:", err);
        alert("❌ Failed to load categories. Please try again.");
      }
    },

    async fetchSubcategories(categoryId) {
      this.subcategories = [];
      if (!categoryId) return;
      try {
        const res = await http.get(`/categories/${categoryId}/subcategories`);
        this.subcategories = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn("Subcategories not available for:", categoryId);
      }
    },

    onCategoryChange(e) {
      this.local.subcategoryId = "";
      this.local.categoryId = e.target.value;
      this.fetchSubcategories(this.local.categoryId);
    },

    onFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.match('image.*')) {
          alert("❌ Please select an image file (JPG/PNG).");
          return;
        }
        this.local.bannerFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => (this.previewImage = ev.target.result);
        reader.readAsDataURL(file);
      }
    },

    removeImage() {
      this.previewImage = null;
      this.local.bannerFile = null;
      this.$refs.fileInput.value = '';
    },

    validateForm() {
      this.showError = true;
      if (!this.local.title?.trim()) return false;
      if (!this.local.categoryId) return false;
      if (!this.local.description?.trim()) return false;
      if (this.local.totalPrice <= 0) return false;
      return true;
    },

 async saveService() {
  if (!this.validateForm()) {
    alert("❌ Please fill in all required fields correctly.");
    return;
  }

  this.isSaving = true;

  try {
    // Get provider ID
    let providerId = null;
    try {
      const loggedProvider = JSON.parse(localStorage.getItem("loggedProvider") || "{}");
      providerId = loggedProvider._id;
    } catch (e) {
      console.warn("Malformed loggedProvider");
    }
    if (!providerId) {
      providerId = localStorage.getItem("provider_id");
    }
    if (!providerId) {
      throw new Error("Provider not authenticated.");
    }

    // Get category name
    const selectedCategory = this.categories.find(cat => cat._id === this.local.categoryId);
    if (!selectedCategory) {
      throw new Error("Please select a valid category.");
    }
    const categoryName = selectedCategory.name;

    // ✅ CRITICAL: For NEW services, DO NOT send slots at all
    // For EDIT services, preserve existing slots
    const serviceData = {
      title: this.local.title.trim(),
      description: this.local.description.trim(),
      totalPrice: this.local.totalPrice,
      bookingPrice: this.local.bookingPrice,
      priceUnit: "ETB",
      status: "draft", // ✅ Always draft for new services
      provider: providerId,
      category: categoryName,
      paymentMethod: this.local.paymentMethod || "Telebirr",
      subcategoryId: this.local.subcategoryId
    };

    // ✅ Only include slots for EDIT mode (preserve existing)
    if (this.isEdit) {
      serviceData.slots = Array.isArray(this.local.slots) ? this.local.slots : [];
    }
    // ✅ For NEW services, NO slots field = truly blank

    // Handle banner upload
    if (this.local.bannerFile) {
      const formData = new FormData();
      
      // Append all service data
      Object.keys(serviceData).forEach(key => {
        if (serviceData[key] !== null && serviceData[key] !== undefined) {
          formData.append(key, serviceData[key]);
        }
      });
      
      // Append the file
      formData.append('banner', this.local.bannerFile);

      const url = this.isEdit ? `/services/${this.local._id}` : "/services";
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = this.isEdit
        ? await http.put(url, formData, config)
        : await http.post(url, formData, config);
      
      console.log("✅ Service saved:", response.data);
      this.$emit("save", response.data);
      
    } else {
      // No file upload - use regular JSON
      if (!this.isEdit) {
        // For new services, explicitly set banner to empty string
        serviceData.banner = "";
      }

      const url = this.isEdit ? `/services/${this.local._id}` : "/services";
      const response = this.isEdit
        ? await http.put(url, serviceData)
        : await http.post(url, serviceData);
      
      console.log("✅ Service saved:", response.data);
      this.$emit("save", response.data);
    }

    alert(`✅ ${this.isEdit ? "Service updated!" : "Service created as draft! Add time slots to make it available."}`);

  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Failed to save service";
    console.error("Save error:", err);
    alert(`❌ ${errorMsg}`);
  } finally {
    this.isSaving = false;
  }
}
  }
};
</script>

<style scoped>
/* ===== KEEP ALL YOUR ORIGINAL STYLES ===== */
.service-form-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  margin: 20px auto;
  font-family: "Poppins", sans-serif;
}

.service-form {
  width: 100%;
  max-width: 720px;
  padding: 36px;
  border-radius: 24px;
  background: white;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.4s ease-out;
  position: relative;
  z-index: 10;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
  letter-spacing: -0.5px;
}

.form-subtitle {
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.5;
}

.form-row {
  margin-bottom: 26px;
}

label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #ef4444;
  font-size: 1.1em;
}

input, select, textarea {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1.02rem;
  background: #f8fafc;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-sizing: border-box;
  font-family: "Poppins", sans-serif;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #22c55e;
  background: white;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
}

.error {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
}

.error-message {
  color: #ef4444;
  font-size: 0.92rem;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

/* File Upload */
.file-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 18px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f0fdf4;
  position: relative;
}

.file-upload-area:hover {
  border-color: #22c55e;
  background: #ecfdf5;
  transform: translateY(-2px);
}

.upload-placeholder i {
  font-size: 2.8rem;
  color: #22c55e;
  margin-bottom: 14px;
}

.upload-placeholder p {
  margin: 6px 0;
  color: #374151;
  font-size: 1.02rem;
}

.upload-hint {
  font-size: 0.85rem;
  color: #94a3b8;
}

.image-preview-container {
  position: relative;
  display: inline-block;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.banner-preview {
  max-width: 100%;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.remove-image-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* Price Section */
.price-section {
  display: flex;
  flex-direction: column;
}

.price-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.price-input label {
  margin-bottom: 8px;
}

/* Status Options */
.status-options {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.status-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.status-option input {
  display: none;
}

.status-label {
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.25s ease;
  min-width: 90px;
  text-align: center;
}

.status-label.published {
  background: #dcfce7;
  color: #166534;
}

.status-label.draft {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-option input:checked + .status-label.published {
  background: #16a34a;
  color: white;
}

.status-option input:checked + .status-label.draft {
  background: #3b82f6;
  color: white;
}

/* Info Message */
.info-message {
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  padding: 16px;
  margin: 20px 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-message i {
  color: #1d4ed8;
  font-size: 1.2rem;
  margin-top: 2px;
}

.info-message p {
  color: #1e40af;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 14px 28px;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  border: none;
  letter-spacing: 0.4px;
  min-height: 52px;
  min-width: 140px;
  justify-content: center;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
}

.cancel-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.save-btn {
  background: linear-gradient(120deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(120deg, #16a34a, #15803d);
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.4);
}

.save-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .service-form {
    padding: 28px;
    margin: 16px;
  }

  .form-title {
    font-size: 1.8rem;
  }

  .price-inputs {
    grid-template-columns: 1fr;
  }

  .status-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  input, select, textarea {
    padding: 16px;
    font-size: 1.05rem;
  }
}

@media (max-width: 480px) {
  .service-form {
    padding: 24px;
    margin: 12px;
  }

  .form-title {
    font-size: 1.6rem;
  }

  .form-subtitle {
    font-size: 1rem;
  }

  input, select, textarea {
    padding: 18px;
  }
}
</style>