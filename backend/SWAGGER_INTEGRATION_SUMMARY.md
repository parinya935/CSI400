# Swagger Integration Summary

## Changes Made

### 1. **New Files Created**

#### `swagger.js`
- OpenAPI 3.0 specification configuration
- Defines base server URLs (development & production)
- Configures JWT Bearer authentication
- Defines reusable schemas for common responses:
  - Customer, Building, Elevator, Part
  - MaintenanceTemplate, MaintenancePlan, MaintenanceJob
  - Contract, ErrorResponse
- References all route files for JSDoc parsing

#### `SWAGGER_SETUP.md`
- Complete documentation on Swagger setup
- Usage instructions
- Guide for adding new endpoints

### 2. **Modified Files**

#### `server.js`
- Added imports: `swagger-ui-express` and `swagger.js`
- Added Swagger middleware: `/api-docs` endpoint
- Configured persistent authorization in Swagger UI

#### `Routes/Core.js`
- Added Swagger JSDoc documentation for:
  - Customers (GET all, POST new, PUT update, DELETE)
  - Buildings (GET all, POST new, PUT update, DELETE)
  - Elevators (GET all, POST new, etc.)
  - Technicians CRUD operations

#### `Routes/Parts.js`
- Added Swagger JSDoc documentation for:
  - Parts CRUD operations
  - Stock levels endpoints
  - Stock adjustment endpoint
  - Part movements history

#### `Routes/Contracts.js`
- Added Swagger JSDoc documentation for:
  - Contracts CRUD operations
  - Quotations CRUD operations
  - Invoices CRUD operations
  - Pricing settings endpoints

#### `Routes/Maintenance.js`
- Added Swagger JSDoc documentation for:
  - Maintenance Templates CRUD
  - Maintenance Plans CRUD
  - Maintenance Jobs CRUD
  - Tickets endpoints

## How to Use

### Access Swagger UI
```
http://localhost:4000/api-docs
```

### Test Authenticated Endpoints
1. Click "Authorize" button (top right of Swagger UI)
2. Enter JWT token: `Bearer <your_jwt_token>`
3. All subsequent requests will include the token

### Key Features
✅ Interactive API exploration and testing
✅ Complete request/response documentation
✅ Reusable schema definitions
✅ Role-based security annotations
✅ Error response examples
✅ Persistent bearer token across requests

## Package Dependencies

Make sure these are installed in `package.json`:
```json
{
  "swagger-ui-express": "^4.x.x",
  "swagger-jsdoc": "^6.x.x"
}
```

If not installed, run:
```bash
npm install swagger-ui-express swagger-jsdoc
```

## Endpoints Documented

### Core (`/api`)
- `/api/customers` - Customer management
- `/api/buildings` - Building management
- `/api/elevators` - Elevator management
- `/api/technicians` - Technician management
- `/api/notifications` - Notifications
- `/api/alerts` - System alerts
- `/api/dashboard/summary` - Dashboard data

### Contracts (`/api`)
- `/api/contracts` - Contract management
- `/api/quotations` - Quotation management
- `/api/invoices` - Invoice management
- `/api/pricing-settings` - Pricing configuration

### Maintenance (`/api`)
- `/api/maintenance/templates` - Template management
- `/api/maintenance/plans` - Plan management
- `/api/maintenance/jobs` - Job management
- `/api/tickets` - Support tickets

### Parts (`/api`)
- `/api/parts` - Part inventory
- `/api/parts/stocks` - Stock levels
- `/api/parts/movements` - Stock movements

## Notes

- All endpoints are protected with JWT authentication (except public routes)
- Security scheme uses Bearer token in Authorization header
- Swagger automatically uses role-based access control information from documentation
- Token persistence is enabled for convenient testing
- API can be tested with "Try it out" buttons in Swagger UI
