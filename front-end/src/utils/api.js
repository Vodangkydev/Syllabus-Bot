// API URL động cho cả local, ngrok và production
let API_URL = "";
if (window.location.hostname.includes("ngrok")) {
  API_URL = "https://4f01-2402-800-63b6-c61f-6190-49c6-ea80-464.ngrok-free.app";
} else if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  API_URL = "http://localhost:8000";
} else {
  API_URL = "https://syllasbus-bot-backend.onrender.com";
}

export default API_URL; 