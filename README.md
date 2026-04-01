# MindMate - AI-Powered Student Wellness Web App 🌱

## 📖 项目简介 (Project Overview)
MindMate 是一款专为大学生设计的 Web 端心理健康与日程管理助手。它通过“无感身份认证”降低使用门槛，利用 Azure AI 提供情感疏导，并能自动从自然语言对话中提取任务，生成结构化的学习日程。当检测到长期的高危情绪时，系统会自动向紧急联系人发送预警邮件 。

## 🛠 技术栈 (Tech Stack)
* **Frontend:** 纯 HTML/CSS/JS (原生 Web 宽屏布局，无框架依赖) 
* **Backend:** Node.js + Express.js (RESTful API 设计) 
* **Database:** MongoDB (推荐使用 Azure Cosmos DB for MongoDB 免费层)
* **AI Services:** * Azure OpenAI (GPT-4o/GPT-3.5) - 负责情感回复与 JSON 任务提取 
  * Azure AI Content Safety - 负责高危词汇的前置拦截
* **Deployment:** Docker 容器化部署 (可部署于 Oracle Cloud 或 Azure Web App) 

---

## 🗄️ 核心数据模型 (Database Schema - MongoDB)

项目采用 NoSQL 文档结构，基于本地 UUID 进行身份绑定，无需传统账号密码登录。

### 1. Users (用户配置)
```json
{
  "_id": "uuid_string", 
  "emergencyContactEmail": "counselor@sait.ca",
  "createdAt": "2026-03-31T10:00:00Z"
}

### 2. Tasks (AI 提取的日程)
{
  "_id": "task_id_string",
  "userId": "uuid_string",
  "title": "Cloud Computing Lab 05",
  "subtitle": "2 hrs est.",
  "status": "pending", // 'pending' | 'done'
  "dueDate": "2026-04-01T23:59:00Z",
  "createdAt": "2026-03-31T10:00:00Z"
}

### 3. MoodLogs (情绪打卡记录)
{
  "_id": "mood_id_string",
  "userId": "uuid_string",
  "score": 80, // 0-100 (0=极度负面, 100=极其正面)
  "emotionTag": "anxious", // AI 提取的情感标签
  "date": "2026-03-31" // YYYY-MM-DD，每天一条
}

### 4. AlertLogs (紧急报警记录 - 防重复发送)
{
  "_id": "alert_id_string",
  "userId": "uuid_string",
  "contactedEmail": "counselor@sait.ca",
  "triggerReason": "Continuous severe anxiety / High-risk keywords",
  "sentAt": "2026-03-31T12:00:00Z"
}

## 🔄 核心业务流程图 (Core Workflows)
### Flow 1: 无感身份认证 (Frictionless Auth)
说明：用户首次访问时生成 UUID，后续所有请求带上此 UUID 即可识别身份。
sequenceDiagram
    participant U as User (Browser)
    participant LS as LocalStorage
    participant API as Node.js API
    participant DB as MongoDB

    U->>LS: Check if UUID exists
    alt No UUID
        LS-->>U: Return Null
        U->>U: Generate Random UUID (e.g., user_123)
        U->>LS: Save UUID
    else Has UUID
        LS-->>U: Return UUID (user_123)
    end
    U->>API: HTTP Request (Headers: { 'x-user-id': 'user_123' })
    API->>DB: Query DB using userId = 'user_123'
    DB-->>API: Return Data
    API-->>U: Return JSON Response

### Flow 2: 核心对话与任务提取 (Chat & Task Extraction)
说明：此流程展示了 AI 如何将学生的抱怨转化为数据库中的实质性日程安排。关键点在于强制 Azure OpenAI 返回 JSON 格式。
sequenceDiagram
    participant UI as Frontend (chat.html)
    participant Node as Backend (Express)
    participant Content as Azure Content Safety
    participant OpenAI as Azure OpenAI (JSON Mode)
    participant DB as MongoDB

    UI->>Node: POST /api/chat { message, userId }
    Node->>Content: Validate message text
    alt Is High Risk (Self-harm/Violence)
        Content-->>Node: Flagged!
        Node->>Node: Trigger Emergency Alert Flow (See Flow 3)
        Node-->>UI: Return crisis intervention message & helpline info
    else Is Safe
        Content-->>Node: Safe
        Node->>OpenAI: Send Prompt (Enforce JSON output: reply, tasks, mood)
        OpenAI-->>Node: Return JSON { reply: "...", tasks: [...], moodScore: 60 }
        
        par DB Operations
            Node->>DB: Insert/Update MoodLogs
            Node->>DB: Insert into Tasks (if any extracted)
        end
        
        Node-->>UI: Return AI reply string
    end

###Flow 3: 异常情绪预警 (Emergency Alert)
说明：结合了安全拦截和持续低落情绪的判定。发送邮件前必须检查 AlertLogs 以防止滥发 。
graph TD
    A[Trigger: New Chat Message] --> B{Content Safety Check}
    B -- High Risk Word Detected --> C[Trigger Alert]
    B -- Safe --> D[Analyze Mood via OpenAI]
    D --> E{Is MoodScore < 30?}
    E -- No --> F[Continue Normal Chat]
    E -- Yes --> G[Check MoodLogs for past 3 days]
    G --> H{Are last 3 days < 30?}
    H -- No --> F
    H -- Yes --> C
    
    C --> I[Query Users DB for EmergencyContactEmail]
    I --> J{Email Exists?}
    J -- No --> K[Abort Alert / Prompt User to Add]
    J -- Yes --> L[Check AlertLogs DB]
    L --> M{Alert sent in last 24h?}
    M -- Yes --> N[Abort - Prevent Spam]
    M -- No --> O[Send Email via Nodemailer/SendGrid]
    O --> P[Log to AlertLogs DB]

🔌 API 接口规范 (API Routes Spec)
后端主要提供以下 RESTful 接口供 Web 前端调用：

请求通用 Header:
x-user-id: <本地生成的 UUID>

POST /api/chat

功能：发送聊天信息，返回 AI 回复。

Body: { "message": "I have a cloud computing exam tomorrow and I'm stressed." }

GET /api/tasks

功能：获取该用户的所有日程列表（用于渲染 Dashboard 左侧）。

PUT /api/tasks/:taskId

功能：更新任务状态（勾选完成）。

Body: { "status": "done" }

GET /api/moods

功能：获取本周情绪记录（用于渲染 Dashboard 的柱状图）。

POST /api/settings/contact

功能：保存紧急联系人邮箱。

Body: { "email": "counselor@sait.ca" }

🚀 环境变量与本地部署 (Environment Variables)
开发前，请在后端根目录创建 .env 文件，并配置以下必需的密钥：

代码段
# Server
PORT=3000

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@your-cosmos-db-url...

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://<your-resource>[.openai.azure.com/](https://.openai.azure.com/)
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini # 或者你的模型部署名称

# Azure Content Safety (Optional but highly recommended)
AZURE_CONTENT_SAFETY_ENDPOINT=https://<your-resource>[.cognitiveservices.azure.com/](https://.cognitiveservices.azure.com/)
AZURE_CONTENT_SAFETY_KEY=your_safety_key_here

# Email Service (For Alerts)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
启动命令 (Start Commands)
npm install (安装依赖)

npm run dev (本地热更新启动)

docker build -t mindmate-backend . (构建生产环境镜像)