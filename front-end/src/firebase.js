// src/firebase.js

// 🧩 Import các thư viện từ Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, deleteUser } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔐 Cấu hình Firebase từ project của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD5ZM1aO6mZVl0rom_l3-UdTgUSKAu-ZgQ",
  authDomain: "vlu-chatbot-5deaf.firebaseapp.com",
  projectId: "vlu-chatbot-5deaf",
  storageBucket: "vlu-chatbot-5deaf.appspot.com",
  messagingSenderId: "283109411846",
  appId: "1:283109411846:web:442f8551e3e785b88ec787"
};

// 🚀 Khởi tạo Firebase app
const app = initializeApp(firebaseConfig);

// 🔐 Khởi tạo Auth và Provider đăng nhập bằng Google
const auth = getAuth(app);
auth.languageCode = "vi";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

// Hàm đăng nhập với Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    throw error;
  }
};

// 🔥 Khởi tạo Firestore DB
const db = getFirestore(app);

// 📦 Khởi tạo Storage
const storage = getStorage(app);

// 💾 Hàm lưu lịch sử chat
const saveChat = async (userId, message, response, sourceDocuments = []) => {
  try {
    if (!userId) throw new Error("User ID is required");
    
    const userRef = doc(db, "users", userId);
    const chatsRef = collection(userRef, "chats");
    const chatData = {
      message,
      response,
      sourceDocuments,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      userId: userId // Add user ID for extra validation
    };
    
    const docRef = await addDoc(chatsRef, chatData);
    console.log("Chat saved with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving chat:", error);
    // Add more detailed error information
    throw new Error(`Failed to save chat: ${error.message}`);
  }
};

// 📖 Hàm đọc lịch sử chat
const getChatHistory = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const chatsRef = collection(userRef, "chats");
    const q = query(
      chatsRef,
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting chat history:", error);
    throw error;
  }
};

// Hàm lấy một cuộc trò chuyện cụ thể
const getChat = async (userId, chatId) => {
  try {
    const userRef = doc(db, "users", userId);
    const chatsRef = collection(userRef, "chats");
    const q = query(
      chatsRef,
      where("message", "==", chatId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting chat:", error);
    throw error;
  }
};

// 📤 Export ra dùng ở các component khác
export {
  auth,
  provider,
  db,
  signInWithGoogle,
  saveChat,
  getChatHistory,
  getChat,
  storage
};

// Hàm xóa tất cả chat của user
export const deleteAllChats = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const chatsRef = collection(userRef, "chats");
    
    // Lấy tất cả documents trong collection chats
    const querySnapshot = await getDocs(chatsRef);
    
    // Xóa từng document
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log("All chats deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting all chats:", error);
    throw error;
  }
};

// Hàm xóa tài khoản người dùng hiện tại
export const deleteCurrentUser = async () => {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('Chưa đăng nhập!');
  try {
    await deleteUser(auth.currentUser);
    return true;
  } catch (error) {
    throw error;
  }
};
