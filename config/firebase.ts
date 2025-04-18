import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
//import { getAnalytics } from "firebase/analytics";

// Firebase 配置信息 - 请替换成自己的配置信息
const firebaseConfig = {
    apiKey: "AIzaSyCaL1SARVLDjtF9fJZe5Zho35hJTuzDUiw",
    authDomain: "distance-80e4f.firebaseapp.com",
    projectId: "distance-80e4f",
    storageBucket: "distance-80e4f.firebasestorage.app",
    messagingSenderId: "433387498156",
    appId: "1:433387498156:web:27a4aca8a3d018a60ccd09",
    measurementId: "G-8E3W8DL561"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
// 获取 Auth 实例
const auth = getAuth(app);

export { app, auth };