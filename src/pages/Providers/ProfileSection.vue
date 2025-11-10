<!-- src/pages/Providers/ProfileSection.vue -->
<template>
  <div class="profile-section">
    <!-- Header with Status Badge -->
    <div class="profile-header">
      <h2>Manage Your Profile</h2>
      <div class="header-right">
        <div class="status-badge" :class="providerStatus">
          {{ providerStatus }}
        </div>
        <button @click="editMode = !editMode" class="edit-btn">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>
    </div>

    <div class="profile-content">
      <!-- Left: Profile Image -->
      <div class="profile-picture-wrapper">
        <div class="profile-picture" @click="triggerFileInput">
          <img v-if="profileImage" :src="profileImage" alt="Profile" />
          <div v-else class="placeholder"><i class="fa-solid fa-user"></i></div>
          <button class="edit-icon"><i class="fa-solid fa-pen"></i></button>
          <input type="file" ref="fileInput" @change="onFileChange" accept="image/*" />
        </div>
      </div>

      <!-- Right: Profile Fields -->
      <div class="profile-info">
        <h3>Personal Information</h3>
        <div class="field"><label>Full Name:</label><input v-model="fullname" :disabled="!editMode" /></div>
        <div class="field"><label>Email:</label><input v-model="email" :disabled="!editMode" /></div>
        <div class="field"><label>Phone:</label><input v-model="phonenumber" :disabled="!editMode" /></div>
        <div class="field"><label>Location:</label><input v-model="location" :disabled="!editMode" /></div>
        <div class="field"><label>FIN:</label><input v-model="FIN" :disabled="!editMode" /></div>
        <div class="field"><label>Work Experience:</label><textarea v-model="workExperience" :disabled="!editMode" rows="3"></textarea></div>
        
        <!-- Certificate (Read-only) -->
        <div v-if="certificate" class="field">
          <label>Certificate:</label>
          <a :href="certificate" target="_blank" class="certificate-link">View Certificate</a>
        </div>

        <!-- Save Button -->
        <button v-if="editMode" class="save-btn" @click="saveProfile">
          <i class="fa-solid fa-floppy-disk"></i> Save Changes
        </button>

        <!-- Status Info -->
        <div v-if="providerStatus !== 'confirmed'" class="status-info">
          <i class="fa-solid fa-circle-info"></i>
          <p>Your account is <strong>{{ providerStatus }}</strong>. 
            You'll be able to create services once approved by admin.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "@/api/index.js";

export default {
  props: {
    provider: { type: Object, required: true, default: () => ({}) }
  },

  data() {
    return {
      // Profile fields
      fullname: '',
      email: '',
      phonenumber: '',
      location: '',
      FIN: '',
      workExperience: '',
      certificate: '',
      
      // Image
      profileImage: null,
      imageFile: null,
      
      // UI
      editMode: false,
    };
  },

  computed: {
    providerStatus() {
      return this.provider.status || 'pending';
    }
  },

  watch: {
    provider: {
      handler(newVal) {
        this.fullname = newVal.fullname || '';
        this.email = newVal.email || '';
        this.phonenumber = newVal.phonenumber || '';
        this.location = newVal.location || '';
        this.FIN = newVal.FIN || '';
        this.workExperience = newVal.workExperience || '';
        this.certificate = newVal.certificate || '';
        this.profileImage = newVal.profileImage || newVal.avatar || null;
      },
      immediate: true
    }
  },

  methods: {
    triggerFileInput() {
      if (this.editMode) this.$refs.fileInput.click();
    },

    onFileChange(event) {
      const file = event.target.files[0];
      if (file && file.type.match('image.*')) {
        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = e => this.profileImage = e.target.result;
        reader.readAsDataURL(file);
      }
    },

    async saveProfile() {
      if (!this.fullname?.trim()) {
        alert("Full name is required.");
        return;
      }

      try {
        const providerId = this.provider._id;
        
        // Upload image if selected
        if (this.imageFile) {
          const fd = new FormData();
          fd.append("photo", this.imageFile);
          await http.patch(`/users/${providerId}/upload-photo`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        // Save profile
        const payload = {
          fullname: this.fullname,
          email: this.email,
          phonenumber: this.phonenumber,
          location: this.location,
          FIN: this.FIN,
          workExperience: this.workExperience,
        };
        await http.put("/users/profile", payload);

        alert("✅ Profile updated!");
        this.editMode = false;
        this.$emit('profileUpdated');

      } catch (err) {
        const msg = err.response?.data?.message || "Failed to update profile";
        alert(`❌ ${msg}`);
      }
    }
  }
};
</script>

<style scoped>
.profile-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-family: 'Inter', sans-serif;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.profile-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.notif-btn, .edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: #475569;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.notif-btn:hover, .edit-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.confirmed { background: #dcfce7; color: #166534; }
.status-badge.rejected { background: #fee2e2; color: #b91c1c; }

.profile-content {
  display: flex;
  gap: 48px;
}

.profile-picture-wrapper {
  flex: 0 0 180px;
}

.profile-picture {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #cbd5e1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-picture:hover {
  border-color: #22c55e;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: 3rem;
  color: #cbd5e1;
}

.edit-icon {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: #22c55e;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.profile-picture input[type="file"] {
  display: none;
}

.profile-info {
  flex: 1;
  min-width: 300px;
}

.profile-info h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}

.field label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.field input,
.field textarea {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  background: #fafafa;
  transition: all 0.2s;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #22c55e;
  background: white;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.field textarea {
  resize: vertical;
  min-height: 80px;
}

.save-btn {
  background: #22c55e;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.status-info {
  margin-top: 20px;
  padding: 16px;
  background: #eff6ff;
  border-radius: 10px;
  color: #1e40af;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.certificate-link {
  color: #2563eb;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-section {
    padding: 20px;
  }
  
  .profile-content {
    flex-direction: column;
    align-items: center;
  }
  
  .profile-picture-wrapper {
    margin-bottom: 24px;
  }
}
</style>