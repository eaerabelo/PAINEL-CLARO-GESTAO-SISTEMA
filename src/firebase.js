import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
    apiKey: "AIzaSyDFZvBcVkrHrxSLKrdbaNB_ZIUFFw8BYLs",
    authDomain: "painel-claro.firebaseapp.com",
    databaseURL: "https://painel-claro-default-rtdb.firebaseio.com",
    projectId: "painel-claro",
    storageBucket: "painel-claro.firebasestorage.app",
    messagingSenderId: "767795934244",
    appId: "1:767795934244:web:05141872efe728701854b1",
    measurementId: "G-1T10VX1ERX"
};


// Evita o erro de "duplicate-app" do Vite, inicializando apenas se já não existir
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
