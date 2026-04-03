const { app } = require('@azure/functions');
const { createCorsResponse } = require('../utils/cors');

app.http('status', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request) => {
        if (request.method === 'OPTIONS') {
            return createCorsResponse(request, { status: 204 });
        }

        return createCorsResponse(request, {
            status: 200,
            jsonBody: {
                ok: true,
                message: 'CI/CD OK',
                service: 'func-mindmate-dev',
                checkedAt: new Date().toISOString()
            }
        });
    }
});
