// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
    updateDoc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Конфиг firebaseConfig из Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDN27P-WsLw5QKB_y-NtmBC8-6CT2i091A",
    authDomain: "moy-ration-diplom.firebaseapp.com",
    projectId: "moy-ration-diplom",
    storageBucket: "moy-ration-diplom.firebasestorage.app",
    messagingSenderId: "130330140303",
    appId: "1:130330140303:web:8fcf646c9a33edd391dafa"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Делаем функции доступными глобально для других скриптов
window.firebaseAuth = auth;
window.firebaseDB = db;

window.firebaseAPI = {
    // Авторизация
    register: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
    onUserChange: (callback) => onAuthStateChanged(auth, callback),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    
    // Получить текущего пользователя
    getCurrentUser: () => auth.currentUser,
    
    // Работа с рецептами в Firestore
    addRecipe: (recipeData) => {
        if (!auth.currentUser) return Promise.reject(new Error('Не авторизован'));
        return addDoc(collection(db, "recipes"), {
            ...recipeData,
            userId: auth.currentUser.uid,
            createdAt: Date.now()
        });
    },
    
    getUserRecipes: async () => {
        if (!auth.currentUser) return [];
        const q = query(collection(db, "recipes"), where("userId", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    deleteRecipe: (id) => deleteDoc(doc(db, "recipes", id)),
    
    updateRecipe: (id, data) => updateDoc(doc(db, "recipes", id), data),
    
    // Сообщает что Firebase загрузился
    isReady: () => true
};

// Сигнализируем что Firebase готов
window.dispatchEvent(new Event('firebaseReady'));
console.log("✅ Firebase инициализирован");