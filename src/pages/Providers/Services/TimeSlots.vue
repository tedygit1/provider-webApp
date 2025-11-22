<template>
  <div class="time-slots-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Loading time slots...</p>
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

    <!-- Service Status Alert -->
    <div v-if="serviceStatus === 'draft'" class="draft-alert">
      <i class="fa-solid fa-clock"></i>
      <div class="alert-content">
        <strong>Draft Service</strong>
        <p>Add time slots to activate and publish this service</p>
      </div>
    </div>

    <!-- Time Slots Management -->
    <div class="time-slots-content" v-if="!loading">
      <!-- Slot Configuration Header -->
      <div class="slot-config-header">
        <h3>Time Slot Configuration</h3>
        <div class="slot-config-controls">
          <label class="config-toggle">
            <input
              type="checkbox"
              v-model="slotConfig.isActive"
            />
            <span class="toggle-label">Active Configuration</span>
          </label>
          <input
            v-model="slotConfig.slotLabel"
            type="text"
            class="slot-label-input"
            placeholder="Configuration Name (e.g., 'Weekly Schedule', 'Holiday Hours')"
          />
        </div>
      </div>

      <!-- Weekly Schedule -->
      <div class="weekly-schedule-section">
        <h4>Weekly Availability Schedule</h4>
        <p class="section-description">
          Set your regular weekly working hours. Customers will be able to book during these available times.
        </p>

        <!-- Simple Date Selection - Just one week start date -->
        <div class="date-selection-section">
          <h5>Select Week Starting Date</h5>
          <div class="week-start-input">
            <label class="date-label">Week Starting (Monday)</label>
            <input
              v-model="weekStartDate"
              type="date"
              class="date-input"
              :min="minDate"
              @change="generateWeekDates"
            />
          </div>
        </div>

        <div class="days-grid">
          <div
            v-for="day in daysOfWeek"
            :key="day.key"
            class="day-card"
            :class="{ 'working-day': isWorkingDay(day.key), 'day-off': !isWorkingDay(day.key) }"
          >
            <div class="day-header">
              <label class="day-toggle">
                <input
                  type="checkbox"
                  :checked="isWorkingDay(day.key)"
                  @change="toggleWorkingDay(day.key, $event.target.checked)"
                />
                <span class="day-label">{{ day.label }}</span>
                <span class="day-date">
                  ({{ getDayDate(day.key) }})
                </span>
              </label>
              <span v-if="!isWorkingDay(day.key)" class="off-label">Day Off</span>
            </div>

            <div v-if="isWorkingDay(day.key)" class="time-slots-list">
              <div
                v-for="(timeSlot, slotIndex) in getTimeSlotsForDay(day.key)"
                :key="slotIndex"
                class="time-slot-item"
                :class="{ 'has-error': timeSlot.hasError }"
              >
                <div class="time-inputs">
                  <input
                    v-model="timeSlot.startTime"
                    type="time"
                    class="time-input"
                    @change="validateTimeSlot(timeSlot)"
                  />
                  <span class="time-separator">to</span>
                  <input
                    v-model="timeSlot.endTime"
                    type="time"
                    class="time-input"
                    @change="validateTimeSlot(timeSlot)"
                  />
                </div>
                <div class="slot-actions">
                  <label class="availability-toggle">
                    <input
                      type="checkbox"
                      v-model="timeSlot.isAvailable"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                  <button
                    class="btn-remove-slot"
                    @click="removeTimeSlot(day.key, slotIndex)"
                    :disabled="getTimeSlotsForDay(day.key).length === 1"
                    title="Remove time slot"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
                <div v-if="timeSlot.hasError" class="slot-error">
                  {{ timeSlot.errorMessage }}
                </div>
              </div>

              <button class="btn-add-slot" @click="addTimeSlot(day.key)">
                <i class="fa-solid fa-plus"></i> Add Time Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="handleCancel">
          <i class="fa-solid fa-arrow-left"></i> Cancel
        </button>
        <div class="primary-actions">
          <button
            class="btn btn-primary"
            @click="saveTimeSlots"
            :disabled="saving || !weekStartDate"
          >
            <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-save"></i>
            {{ saving ? 'Saving...' : hasExistingSlot ? 'Update Time Slots' : 'Save Time Slots' }}
          </button>
          
          <!-- Clear/Reset Button -->
          <button
            v-if="hasExistingSlot"
            class="btn btn-warning"
            @click="resetToDefault"
            :disabled="saving"
          >
            <i class="fa-solid fa-undo"></i>
            Reset to Default
          </button>
        </div>
      </div>

      <!-- Debug Info (remove in production) -->
      <div v-if="debugMode" class="debug-info">
        <h5>Debug Info:</h5>
        <p>Has Existing Slot: {{ hasExistingSlot }}</p>
        <p>Slot ID: {{ existingSlotId }}</p>
        <p>Week Start: {{ weekStartDate }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/api/index.js';

export default {
  name: 'TimeSlots',
  props: {
    service: {
      type: Object,
      required: true
    },
    serviceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      saving: false,
      errorMessage: '',
      successMessage: '',
      debugMode: true, // Set to false in production
      
      // Current slot configuration
      slotConfig: {
        slotLabel: 'Weekly Schedule',
        isActive: true
      },
      
      // Simple week start date instead of individual dates
      weekStartDate: '',
      
      // Store dates for each day (auto-generated from weekStartDate)
      dayDates: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      },
      
      // Weekly schedule data structure
      weeklySchedule: {
        monday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        tuesday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        wednesday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        thursday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        friday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        saturday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        sunday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }]
      },
      
      daysOfWeek: [
        { key: 'monday', name: 'monday', label: 'Monday' },
        { key: 'tuesday', name: 'tuesday', label: 'Tuesday' },
        { key: 'wednesday', name: 'wednesday', label: 'Wednesday' },
        { key: 'thursday', name: 'thursday', label: 'Thursday' },
        { key: 'friday', name: 'friday', label: 'Friday' },
        { key: 'saturday', name: 'saturday', label: 'Saturday' },
        { key: 'sunday', name: 'sunday', label: 'Sunday' }
      ],
      
      // Store existing slots data
      existingSlots: [],
      existingSlotId: null
    };
  },

  computed: {
    minDate() {
      return new Date().toISOString().split('T')[0];
    },
    
    // Check if we have an existing slot to update
    hasExistingSlot() {
      return this.existingSlotId !== null;
    },

    // Service status for display in template
    serviceStatus() {
      if (!this.service) return 'draft';
      
      if (!this.service.slots || !Array.isArray(this.service.slots) || this.service.slots.length === 0) {
        return 'draft';
      }
      
      const hasRealSlots = this.service.slots.some(slot => {
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
    }
  },

  async created() {
    await this.initializeTimeSlots();
    this.initializeDefaultDates();
  },

  methods: {
    // ✅ FIXED: Initialize with existing slots - use the FIRST one only
    async initializeTimeSlots() {
      this.loading = true;
      try {
        // Get existing slots for this service
        const response = await http.get(`/services/${this.serviceId}/slots`);
        this.existingSlots = response.data || [];
        
        console.log('🔍 Found existing slots:', this.existingSlots.length);
        
        if (this.existingSlots.length > 0) {
          // ✅ USE THE FIRST SLOT ONLY for editing/updating
          const firstSlot = this.existingSlots[0];
          this.existingSlotId = firstSlot.slotId;
          this.loadExistingSchedule(firstSlot);
          console.log('🔄 Loading existing slot:', this.existingSlotId);
        } else {
          // Initialize default for new service
          this.initializeDefaultSchedule();
          console.log('🆕 No existing slots, using default');
        }
      } catch (error) {
        console.warn('Could not load existing slots, using default:', error);
        this.initializeDefaultSchedule();
      } finally {
        this.loading = false;
      }
    },

    // ✅ FIXED: Load existing schedule data
    loadExistingSchedule(slot) {
      console.log('📥 Loading schedule from slot:', slot.slotId);
      
      if (slot.slotLabel) {
        this.slotConfig.slotLabel = slot.slotLabel;
      }
      
      if (slot.isActive !== undefined) {
        this.slotConfig.isActive = slot.isActive;
      }
      
      if (slot.weeklySchedule && Array.isArray(slot.weeklySchedule)) {
        // Reset weekly schedule
        this.weeklySchedule = {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
        };
        
        // Reset day dates
        this.dayDates = {
          monday: '', tuesday: '', wednesday: '', thursday: '',
          friday: '', saturday: '', sunday: ''
        };
        
        // Populate with existing data
        slot.weeklySchedule.forEach(daySchedule => {
          if (daySchedule && daySchedule.day && Array.isArray(daySchedule.timeSlots)) {
            this.weeklySchedule[daySchedule.day] = daySchedule.timeSlots.map(timeSlot => ({
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              isAvailable: timeSlot.isAvailable !== false,
              hasError: false,
              errorMessage: ''
            }));
            
            // Set date if available
            if (daySchedule.date) {
              this.dayDates[daySchedule.day] = this.parseBackendDate(daySchedule.date);
            }
          }
        });
        
        // Set week start date from Monday's date
        if (this.dayDates.monday) {
          this.weekStartDate = this.dayDates.monday;
        }
      }
    },

    parseBackendDate(dateString) {
      // Convert from "DD/MM/YYYY" to "YYYY-MM-DD"
      if (!dateString) return '';
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return '';
    },

    formatDateForBackend(dateString) {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    },

    formatDateForDisplay(dateString) {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    },

    getDayDate(dayKey) {
      return this.dayDates[dayKey] ? this.formatDateForDisplay(this.dayDates[dayKey]) : '';
    },

    // ✅ FIXED: Generate week dates from single start date
    generateWeekDates() {
      if (!this.weekStartDate) return;
      
      const startDate = new Date(this.weekStartDate);
      this.daysOfWeek.forEach((day, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        this.dayDates[day.key] = this.formatDateForInput(date);
      });
    },

    formatDateForInput(date) {
      return date.toISOString().split('T')[0];
    },

    initializeDefaultDates() {
      // Only set default dates if we don't have existing data
      if (!this.weekStartDate) {
        const today = new Date();
        const nextMonday = new Date(today);
        
        const daysUntilMonday = (1 - today.getDay() + 7) % 7;
        nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
        
        this.weekStartDate = this.formatDateForInput(nextMonday);
        this.generateWeekDates();
      }
    },

    initializeDefaultSchedule() {
      console.log('🆕 Initialized default weekly schedule');
      // Reset to default schedule
      this.weeklySchedule = {
        monday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        tuesday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        wednesday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        thursday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        friday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        saturday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
        sunday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }]
      };
    },

    // ✅ FIXED: Save time slots using correct endpoint
  async saveTimeSlots() {
  if (!this.weekStartDate) {
    this.setError('Please select a week start date');
    return;
  }

  if (!this.validateAllTimeSlots()) {
    this.setError('Please fix time slot errors before saving');
    return;
  }

  this.saving = true;
  this.errorMessage = '';

  try {
    const requestData = this.prepareRequestData();

    console.log('🚀 Saving time slots:', {
      hasExistingSlot: this.hasExistingSlot,
      slotId: this.existingSlotId,
      data: requestData
    });

    let response;

    if (this.hasExistingSlot) {
      // ✅ FIXED: Use PUT endpoint for existing slots
      response = await http.put(
        `/services/${this.serviceId}/slots/${this.existingSlotId}`,
        requestData
      );
      console.log('✅ Time slots UPDATED successfully:', response.data);
      this.setSuccess('Time slots updated successfully!');
    } else {
      // ✅ FIXED: Create new slot with correct data structure
      response = await http.post(`/services/${this.serviceId}/slots`, requestData);
      this.existingSlotId = response.data.slotId; // Store the new slot ID
      console.log('✅ New time slots CREATED successfully:', response.data);
      this.setSuccess('Time slots created successfully!');
    }
    
    // Emit saved event to refresh parent
    this.$emit('saved', response.data);

  } catch (error) {
    console.error('❌ Error saving time slots:', error);
    this.handleApiError(error, 'save time slots');
  } finally {
    this.saving = false;
  }
},

// ✅ FIXED: Prepare request data with correct structure
prepareRequestData() {
  const slotData = this.prepareSlotData();
  
  if (this.hasExistingSlot) {
    // For PUT (updating existing slot), send the slot object directly
    return slotData;
  } else {
    // For POST (creating new slot), wrap in slots array
    return {
      slots: [slotData]
    };
  }
},
    // ✅ FIXED: Prepare slot data for backend
    prepareSlotData() {
      const weeklySchedule = [];

      this.daysOfWeek.forEach(day => {
        const timeSlots = this.weeklySchedule[day.key];
        const date = this.dayDates[day.key];
        
        const formattedTimeSlots = (timeSlots && timeSlots.length > 0) 
          ? timeSlots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: slot.isAvailable !== false
            }))
          : [];

        weeklySchedule.push({
          date: this.formatDateForBackend(date),
          day: day.key,
          isWorkingDay: formattedTimeSlots.length > 0,
          timeSlots: formattedTimeSlots
        });
      });

      return {
        slotLabel: this.slotConfig.slotLabel,
        isActive: this.slotConfig.isActive,
        weeklySchedule: weeklySchedule,
        isBooked: false
      };
    },

    // Reset to default schedule
    resetToDefault() {
      if (confirm('Are you sure you want to reset to default schedule? This will clear all your changes.')) {
        this.initializeDefaultSchedule();
        this.setSuccess('Reset to default schedule');
      }
    },

    // Existing methods (keep these as they are working)
    isWorkingDay(day) {
      return this.weeklySchedule[day] && this.weeklySchedule[day].length > 0;
    },

    getTimeSlotsForDay(day) {
      return this.weeklySchedule[day] || [];
    },

    toggleWorkingDay(day, isWorking) {
      if (isWorking) {
        if (!this.weeklySchedule[day] || this.weeklySchedule[day].length === 0) {
          this.weeklySchedule[day] = [{ startTime: '09:00', endTime: '17:00', isAvailable: true }];
        }
      } else {
        this.weeklySchedule[day] = [];
      }
    },

    addTimeSlot(day) {
      if (!this.weeklySchedule[day]) {
        this.weeklySchedule[day] = [];
      }
      
      this.weeklySchedule[day].push({
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        hasError: false,
        errorMessage: ''
      });
    },

    removeTimeSlot(day, slotIndex) {
      if (this.weeklySchedule[day] && this.weeklySchedule[day].length > 1) {
        this.weeklySchedule[day].splice(slotIndex, 1);
      }
    },

    validateTimeSlot(timeSlot) {
      timeSlot.hasError = false;
      timeSlot.errorMessage = '';

      if (timeSlot.startTime && timeSlot.endTime) {
        if (timeSlot.startTime >= timeSlot.endTime) {
          timeSlot.hasError = true;
          timeSlot.errorMessage = 'End time must be after start time';
          return false;
        }
      }
      
      return true;
    },

    validateAllTimeSlots() {
      let isValid = true;
      
      this.daysOfWeek.forEach(day => {
        const timeSlots = this.weeklySchedule[day.key];
        if (timeSlots) {
          timeSlots.forEach(slot => {
            if (!this.validateTimeSlot(slot)) {
              isValid = false;
            }
          });
        }
      });
      
      return isValid;
    },

    handleApiError(error, operation) {
      console.error(`❌ Error during ${operation}:`, error);
      
      let errorMsg = `Failed to ${operation}`;
      
      if (error.response?.status === 400) {
        errorMsg = 'Invalid data format. Please check your time slots.';
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      this.setError(errorMsg);
    },

    handleCancel() {
      this.$emit('close');
    },

    setError(message) {
      this.errorMessage = message;
      setTimeout(() => { this.errorMessage = ''; }, 5000);
    },

    setSuccess(message) {
      this.successMessage = message;
      setTimeout(() => { this.successMessage = ''; }, 3000);
    }
  }
};
</script>

<style scoped>
/* Add these new styles for the simplified date selection */
.week-start-input {
  max-width: 300px;
}

.date-selection-section h5 {
  margin-bottom: 12px;
  color: #334155;
}

.debug-info {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
  font-size: 0.8rem;
  color: #64748b;
}

.debug-info h5 {
  margin: 0 0 8px 0;
  color: #475569;
}

.time-slots-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Poppins", sans-serif;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 16px;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
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

.draft-alert {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  color: #d97706;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.draft-alert i {
  font-size: 1.2rem;
  margin-top: 2px;
}

.alert-content strong {
  display: block;
  margin-bottom: 4px;
  font-size: 1rem;
}

.alert-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.slot-config-header {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.slot-config-header h3 {
  color: #0f172a;
  margin-bottom: 16px;
}

.slot-config-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.config-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #334155;
}

.toggle-label {
  font-size: 0.9rem;
}

.slot-label-input {
  flex: 1;
  min-width: 250px;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
}

.slot-label-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.date-selection-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.date-selection-section h5 {
  color: #334155;
  margin-bottom: 16px;
  font-size: 1.1rem;
}

.date-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-label {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.weekly-schedule-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.weekly-schedule-section h4 {
  color: #0f172a;
  margin-bottom: 8px;
}

.section-description {
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.day-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.day-card.working-day {
  border-color: #22c55e;
  background: #f0fdf4;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.day-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.day-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.day-label {
  font-size: 1rem;
}

.day-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: normal;
}

.off-label {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
}

.time-slots-list {
  space-y: 12px;
}

.time-slot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.time-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.time-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.time-separator {
  color: #64748b;
  font-size: 0.9rem;
}

.slot-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.availability-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.availability-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .4s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #22c55e;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.btn-remove-slot {
  background: #fee2e2;
  border: none;
  color: #dc2626;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove-slot:hover:not(:disabled) {
  background: #fecaca;
}

.btn-remove-slot:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add-slot {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  color: #475569;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
  transition: background 0.2s;
}

.btn-add-slot:hover {
  background: #e2e8f0;
}

.existing-slots-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.existing-slots-section h4 {
  color: #0f172a;
  margin-bottom: 16px;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.slot-item.active-slot {
  border-color: #22c55e;
  background: #f0fdf4;
}

.slot-info h5 {
  margin: 0 0 4px 0;
  color: #0f172a;
}

.slot-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #f1f5f9;
  color: #64748b;
}

.slot-dates {
  font-size: 0.85rem;
  color: #64748b;
}

.slot-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-outline:hover {
  background: #f8fafc;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 24px 0;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #22c55e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.time-slot-item.has-error {
  border: 1px solid #dc2626;
  border-radius: 6px;
  padding: 8px;
}

.slot-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 4px;
}

.day-card.day-off {
  background: #f8fafc;
  opacity: 0.7;
}

.primary-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .time-slots-container {
    padding: 15px;
  }
  
  .slot-config-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .slot-label-input {
    min-width: auto;
  }
  
  .date-inputs-grid {
    grid-template-columns: 1fr;
  }
  
  .days-grid {
    grid-template-columns: 1fr;
  }
  
  .slot-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .slot-actions {
    justify-content: flex-end;
  }
  
  .primary-actions {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .time-slot-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-remove-slot {
    align-self: flex-end;
    width: auto;
    padding: 8px 12px;
  }
}
</style>