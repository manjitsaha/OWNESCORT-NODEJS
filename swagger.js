const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0", // OpenAPI version
        info: {
            title: "My Node.js API",
            version: "1.0.0",
            description: "API documentation with Swagger",
        },
        servers: [
            {
                url: "http://localhost:3000", // Your server URL
            },
        ],
    },
    // Paths to files where APIs are defined using Swagger comments
    apis: ["./routes/*.js", "./app.js"],
};

const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app, port) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`📖 Swagger Docs available at http://localhost:${port}/api-docs`);
}

module.exports = swaggerDocs;
