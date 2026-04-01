const { app } = require('@azure/functions');
const mongoose = require('mongoose');

// Serverless 最佳实践：在全局缓存数据库连接，防止每次请求都重新建连导致连接数耗尽
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    console.log("⏳ 正在尝试连接 Azure Cosmos DB...");
    // 自动读取 local.settings.json 里的配置
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    console.log("🟢 Cosmos DB 连接成功！");
    return db;
}

app.http('test-db', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            await connectToDatabase();
            
            return { 
                status: 200, 
                jsonBody: { 
                    message: "🎉 恭喜！Serverless 函数已成功连上你的 Azure Cosmos DB！",
                    status: "success"
                } 
            };
        } catch (error) {
            context.log('🔴 数据库连接失败:', error.message);
            return { 
                status: 500, 
                jsonBody: { 
                    error: "数据库连接失败", 
                    details: error.message 
                } 
            };
        }
    }
});