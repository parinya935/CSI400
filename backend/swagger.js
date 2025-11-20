import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LiftCare API',
      version: '1.0.0',
      description: 'LiftCare Backend API Documentation - Elevator Maintenance Management System',
      contact: {
        name: 'LiftCare Support',
        email: 'support@liftcare.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.liftcare.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header',
        },
      },
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'ABC Company' },
            business_type: { type: 'string', example: 'Commercial' },
            address: { type: 'string', example: '123 Main St' },
            contact_name: { type: 'string', example: 'John Doe' },
            contact_phone: { type: 'string', example: '08-1234-5678' },
            contact_email: { type: 'string', example: 'john@abc.com' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Building: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            customer_id: { type: 'integer' },
            name: { type: 'string' },
            address: { type: 'string' },
            building_type: { type: 'string' },
            customer_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Elevator: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'EL001' },
            name: { type: 'string', example: 'Elevator A' },
            building_id: { type: 'integer' },
            brand: { type: 'string', example: 'Otis' },
            model: { type: 'string', example: 'Gen2' },
            install_year: { type: 'integer', example: 2020 },
            install_location: { type: 'string', example: 'Building 1, Floor 1' },
            capacity: { type: 'integer', example: 1000 },
            state: { type: 'string', enum: ['normal', 'fault', 'in_maintenance', 'waiting_maintenance', 'waiting_quotation'] },
            current_floor: { type: 'integer' },
            current_load: { type: 'integer' },
            last_maintenance_at: { type: 'string', format: 'date-time' },
            next_maintenance_at: { type: 'string', format: 'date-time' },
          },
        },
        Part: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            part_code: { type: 'string', example: 'P-001' },
            name: { type: 'string', example: 'Motor' },
            brand: { type: 'string' },
            model: { type: 'string' },
            unit: { type: 'string', example: 'pcs' },
            cost_price: { type: 'number' },
            sell_price: { type: 'number' },
            min_stock: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        MaintenanceTemplate: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Monthly Check' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        MaintenancePlan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            elevator_id: { type: 'string' },
            contract_id: { type: 'integer' },
            template_id: { type: 'integer' },
            frequency_per_year: { type: 'integer' },
            next_run_at: { type: 'string', format: 'date-time' },
            last_run_at: { type: 'string', format: 'date-time' },
            is_active: { type: 'boolean' },
          },
        },
        MaintenanceJob: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            elevator_id: { type: 'string' },
            plan_id: { type: 'integer' },
            template_id: { type: 'integer' },
            contract_id: { type: 'integer' },
            ticket_id: { type: 'integer' },
            technician_id: { type: 'integer' },
            job_type: { type: 'string', enum: ['planned', 'emergency'] },
            started_at: { type: 'string', format: 'date-time' },
            finished_at: { type: 'string', format: 'date-time' },
            remarks: { type: 'string' },
            total_labor_hours: { type: 'number' },
            labor_cost: { type: 'number' },
            parts_cost: { type: 'number' },
            total_cost: { type: 'number' },
            elevator_name: { type: 'string' },
            building_name: { type: 'string' },
            technician_name: { type: 'string' },
            contract_code: { type: 'string' },
          },
        },
        Contract: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            customer_id: { type: 'integer' },
            contract_code: { type: 'string', example: 'C-001' },
            contract_type: { type: 'string', example: 'Standard' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            maintenance_times_per_year: { type: 'integer' },
            included_items: { type: 'string' },
            excluded_items: { type: 'string' },
            notify_before_days: { type: 'integer', default: 30 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './Routes/Core.js',
    './Routes/Contracts.js',
    './Routes/Maintenance.js',
    './Routes/Parts.js',
    './Auth/Auth.js',
  ],
};

const specs = swaggerJsdoc(options);
export default specs;
