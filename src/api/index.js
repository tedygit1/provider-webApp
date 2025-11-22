// src/api/index.js
import axios from "axios";

// ✅ SMART URL CONFIGURATION
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    console.log("🚀 Development mode: Using proxy /api");
    return "/api";
  } else {
    const productionURL = "https://infinity-booking-backend1-1.onrender.com/infinity-booking";
    console.log("🌐 Production mode: Using direct URL:", productionURL);
    return productionURL;
  }
};

const http = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Enhanced request logging
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("provider_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Enhanced error logging
http.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    console.error("❌ API Error Details:", {
      fullURL: error.config?.baseURL + error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code
    });

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ 
        message: "Request timeout. Server is taking too long to respond.",
        code: 'ECONNABORTED'
      });
    }

    if (!error.response) {
      return Promise.reject({ 
        message: "Cannot connect to server. Please check your internet connection.",
        code: 'NETWORK_ERROR'
      });
    }

    return Promise.reject(
      error.response?.data || { message: "Server error occurred" }
    );
  }
);

// ✅ SIMPLE EXPORT - NO COMPLEX MODULES!
// Your components will continue using:
// import http from "@/api/index.js";
// http.post("/services/123/slots", data)
export default http;