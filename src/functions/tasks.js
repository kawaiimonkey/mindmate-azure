const { app } = require('@azure/functions');
const mongoose = require('mongoose');
const Task = require('../models/Task'); // Import the Task model
const { createCorsResponse } = require('../utils/cors');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
}

app.http('tasks', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            if (request.method === 'OPTIONS') {
                return createCorsResponse(request, { status: 204 });
            }

            await connectToDatabase();

            // ----------------------------------------
            // [GET] Endpoint: Fetch task list
            // ----------------------------------------
            if (request.method === 'GET') {
                // Extract user ID from URL query parameters (e.g., /api/tasks?userId=user123)
                const userId = request.query.get('userId');
                
                if (!userId) {
                    return createCorsResponse(request, {
                        status: 400,
                        jsonBody: { error: "Missing required parameter: userId" }
                    });
                }

                // Cosmos DB for Mongo can reject server-side order-by when the index policy
                // doesn't include that path yet, so we sort in application code for now.
                const tasks = await Task.find({ userId });
                tasks.sort((a, b) => {
                    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                    return aTime - bTime;
                });
                
                return createCorsResponse(request, {
                    status: 200, 
                    jsonBody: {
                        status: "success",
                        count: tasks.length,
                        data: tasks
                    } 
                });
            }

            // ----------------------------------------
            // [POST] Endpoint: Create a new task
            // ----------------------------------------
            if (request.method === 'POST') {
                const body = await request.json();
                const { userId, title, subtitle, dueDate } = body;

                // Strict input validation
                if (!userId || !title) {
                    return createCorsResponse(request, {
                        status: 400,
                        jsonBody: { error: "Missing required fields: userId or title" }
                    });
                }

                // Instantiate the model and save to Cosmos DB
                const newTask = new Task({
                    userId,
                    title,
                    subtitle: subtitle || '',
                    dueDate: dueDate || new Date() // Default to current date if not provided
                });

                const savedTask = await newTask.save();
                
                return createCorsResponse(request, {
                    status: 201, // 201 Created
                    jsonBody: {
                        status: "success",
                        message: "Task created successfully",
                        data: savedTask
                    } 
                });
            }

            return createCorsResponse(request, {
                status: 405,
                jsonBody: { error: "Method Not Allowed" }
            });
        } catch (error) {
            context.log('🔴 Tasks API Error:', error.message);
            return createCorsResponse(request, {
                status: 500, 
                jsonBody: { error: "Internal Server Error", details: error.message } 
            });
        }
    }
});
