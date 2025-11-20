# Swagger API Documentation Setup

## Overview
Swagger/OpenAPI documentation has been added to the LiftCare backend API. This provides interactive API documentation that allows you to test endpoints directly from the browser.

## Installation

The following packages have been installed:
- `swagger-ui-express`: UI for Swagger documentation
- `swagger-jsdoc`: Generates Swagger specs from JSDoc comments

To install these packages manually:
```bash
npm install swagger-ui-express swagger-jsdoc
```

## Accessing Swagger Documentation

Once the server is running, access the Swagger UI at:
```
http://localhost:4000/api-docs
```

## Structure

### Swagger Configuration
- **File**: `swagger.js`
- Contains the OpenAPI 3.0 specification definition
- Defines reusable schemas for API responses
- Configures security schemes (Bearer Token JWT)

### JSDoc Documentation in Routes

Swagger documentation is added using JSDoc comments above each route:

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Brief description
 *     description: Longer description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 */
```

## Documented Endpoints

### Core Routes (`/api`)
- **Customers**: GET, POST, PUT, DELETE
- **Buildings**: GET, POST, PUT, DELETE
- **Elevators**: GET, POST, PUT, DELETE
- **Technicians**: GET, POST, PUT, DELETE

### Contracts Routes (`/api`)
- **Contracts**: GET, POST, PUT, DELETE
- **Quotations**: GET, POST, PUT, DELETE
- **Invoices**: GET, POST, PUT, DELETE
- **Pricing Settings**: GET, PUT

### Maintenance Routes (`/api`)
- **Templates**: GET, POST, PUT, DELETE
- **Plans**: GET, POST, PUT, DELETE
- **Jobs**: GET, POST, PUT, DELETE
- **Tickets**: GET, POST

### Parts Routes (`/api`)
- **Parts**: GET, POST, PUT, DELETE
- **Parts Stocks**: GET, POST
- **Parts Movements**: GET

## Authentication

All endpoints require JWT Bearer token authentication. 

To test authenticated endpoints in Swagger UI:
1. Click the "Authorize" button in the top right
2. Enter your JWT token in the format: `Bearer <your_token>`
3. Click "Authorize"

## Reusable Schemas

Common response schemas are defined in `swagger.js`:
- Customer
- Building
- Elevator
- Part
- MaintenanceTemplate
- MaintenancePlan
- MaintenanceJob
- Contract
- ErrorResponse

These schemas can be referenced using:
```javascript
$ref: '#/components/schemas/SchemaName'
```

## Server Configuration

In `server.js`, Swagger middleware is setup:

```javascript
import swaggerUi from "swagger-ui-express";
import specs from "./swagger.js";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, { 
  swaggerOptions: { persistAuthorization: true } 
}));
```

The `persistAuthorization: true` option keeps the Bearer token in place while browsing.

## Adding New Endpoints

To add Swagger documentation to a new endpoint:

1. Add JSDoc comment before the route definition
2. Include proper tags, parameters, requestBody, and responses
3. Reference existing schemas from `swagger.js` or create new ones
4. Swagger will automatically regenerate the documentation

Example:
```javascript
/**
 * @swagger
 * /api/newendpoint:
 *   get:
 *     summary: Get new endpoint
 *     tags: [NewTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/newendpoint", authRequired, async (req, res) => {
  // Handler code
});
```

## Features

- ✅ Interactive API testing
- ✅ Automatic Bearer token persistence
- ✅ Request/response schemas with validation
- ✅ Role-based security documentation
- ✅ Organized by resource tags
- ✅ Error response documentation

## References

- [Swagger/OpenAPI Documentation](https://swagger.io/specification/)
- [swagger-jsdoc GitHub](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express GitHub](https://github.com/scottie1984/swagger-ui-express)
