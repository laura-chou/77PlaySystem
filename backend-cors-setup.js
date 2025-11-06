// 77PlaySystem 後端 CORS 設定
// 這個檔案展示如何在後端設定 CORS 來允許跨域請求

const express = require('express');
const cors = require('cors');
const app = express();

// 方法 1: 使用 Express CORS 套件（推薦）
const corsOptions = {
    origin: function (origin, callback) {
        // 允許的 origins - 包含你的域名
        const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://dev-77playsystem.onrender.com',
        'https://staging.77playsystem.com',
        'https://77playsystem.com',
        'https://www.77playsystem.com'
        ];

        // 允許沒有 origin 的請求（如 mobile apps）
        if (!origin) return callback(null, true);

        // 檢查 origin 是否在允許列表中
        if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS allowed for origin:', origin);
        callback(null, true);
        } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Cookie',
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// 方法 2: 手動設定 CORS headers
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:3000',
        'https://dev-77playsystem.onrender.com',
        'https://77playsystem.com'
    ];

    console.log('🌐 Request origin:', origin);
    console.log('📋 Allowed origins:', allowedOrigins);

    // 檢查 origin 是否允許
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        console.log('✅ CORS origin allowed:', origin);
    } else if (origin) {
        console.log('❌ CORS origin blocked:', origin);
    }

    // 設定其他 CORS headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Total-Count');
    res.header('Access-Control-Max-Age', '86400');

    // 處理 preflight 請求
    if (req.method === 'OPTIONS') {
        console.log('🔄 Preflight request handled');
        res.status(200).end();
        return;
    }

    next();
});

// 方法 3: 使用環境變數
const corsFromEnv = {
    origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'https://dev-77playsystem.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ]
};

// 如果使用方法 3，取消註解下面這行
// app.use(cors(corsFromEnv));

// 測試路由
app.get('/test', (req, res) => {
    res.json({ message: 'CORS is working!', origin: req.headers.origin });
});

// 登入路由
app.post('/user/login', (req, res) => {
    const { account } = req.body;

    // 這裡是你的登入邏輯
    if (account) {
        res.json({
        success: true,
        message: 'Login successful'
        });
    } else {
        res.status(400).json({
        success: false,
        message: 'Account is required'
        });
    }
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`77PlaySystem Backend running on port ${PORT}`);
    console.log('CORS enabled for:', corsOptions.origin);
    console.log('Test endpoint: GET /test');
    console.log('Login endpoint: POST /auth/login');
});

module.exports = app;
