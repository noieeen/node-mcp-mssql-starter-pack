import { query } from "../libs/db.js";
import { z } from "zod";
// You can also load templates from external files or database
// export const QUERY_TEMPLATES = await loadTemplatesFromFile('templates.json');
// Define your business query templates
export const QUERY_TEMPLATES = [
    {
        id: "customer_most_orders",
        name: "Customer with Most Orders",
        description: "Find which customer has placed the most orders",
        category: "customer_analysis",
        sql: `
            SELECT TOP(@limit)
                c.customer_id,
                c.customer_name,
                c.email,
                COUNT(o.order_id) as total_orders,
                SUM(o.total_amount) as total_spent
            FROM CRM_Customer c
                     JOIN Orders o ON c.customer_id = o.customer_id
            WHERE o.order_date >= COALESCE(?, '1900-01-01')
            GROUP BY c.customer_id, c.customer_name, c.email
            ORDER BY total_orders DESC
        `,
        parameters: [
            {
                name: "start_date",
                type: "date",
                description: "Only count orders from this date onwards (optional)",
                required: false,
                default: null
            },
            {
                name: "limit",
                type: "number",
                description: "Maximum number of customers to return",
                required: false,
                default: 10
            }
        ],
        example_params: { start_date: "2024-01-01", limit: 5 },
        tags: ["customer", "orders", "analytics"]
    },
    {
        id: "top_products",
        name: "Top Selling Products",
        description: "Find the most popular products by quantity or revenue",
        category: "product_analysis",
        sql: `
            SELECT TOP(@limit)
                p.product_id,
                p.product_name,
                p.category,
                SUM(oi.quantity) as total_quantity_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue,
                COUNT(DISTINCT oi.order_id) as number_of_orders
            FROM Products p
                     JOIN Order_Items oi ON p.product_id = oi.product_id
                     JOIN Orders o ON oi.order_id = o.order_id
            WHERE o.order_date >= COALESCE(?, '1900-01-01')
            GROUP BY p.product_id, p.product_name, p.category
            ORDER BY
                CASE
                    WHEN ? = 'revenue' THEN total_revenue
                    ELSE total_quantity_sold
                    END DESC
        `,
        parameters: [
            {
                name: "start_date",
                type: "date",
                description: "Only include orders from this date onwards",
                required: false,
                default: null
            },
            {
                name: "sort_by",
                type: "string",
                description: "Sort by 'quantity' or 'revenue'",
                required: false,
                default: "quantity"
            },
            {
                name: "limit",
                type: "number",
                description: "Number of products to return",
                required: false,
                default: 10
            }
        ],
        example_params: { start_date: "2024-01-01", sort_by: "revenue", limit: 5 },
        tags: ["products", "sales", "analytics"]
    },
    {
        id: "customer_lifetime_value",
        name: "Customer Lifetime Value Analysis",
        description: "Calculate customer lifetime value metrics",
        category: "customer_analysis",
        sql: `
            SELECT TOP(@limit)
                c.customer_id,
                c.customer_name,
                c.registration_date,
                COUNT(o.order_id) as total_orders,
                SUM(o.total_amount) as lifetime_value,
                AVG(o.total_amount) as avg_order_value,
                MIN(o.order_date) as first_order_date,
                MAX(o.order_date) as last_order_date,
                DATEDIFF(MAX(o.order_date), MIN(o.order_date)) as customer_lifespan_days
            FROM CRM_Customer c
                     LEFT JOIN Orders o ON c.customer_id = o.customer_id
            WHERE c.registration_date >= COALESCE(?, '1900-01-01')
            GROUP BY c.customer_id, c.customer_name, c.registration_date
            HAVING lifetime_value >= COALESCE(?, 0)
            ORDER BY lifetime_value DESC
        `,
        parameters: [
            {
                name: "registration_from",
                type: "date",
                description: "Only include customers registered from this date",
                required: false,
                default: null
            },
            {
                name: "min_value",
                type: "number",
                description: "Minimum lifetime value threshold",
                required: false,
                default: 0
            },
            {
                name: "limit",
                type: "number",
                description: "Number of customers to return",
                required: false,
                default: 50
            }
        ],
        example_params: { registration_from: "2023-01-01", min_value: 1000, limit: 20 },
        tags: ["customer", "lifetime_value", "analytics"]
    },
    {
        id: "monthly_sales_trend",
        name: "Monthly Sales Trend",
        description: "Show sales trends by month",
        category: "time_analysis",
        sql: `
            SELECT
                DATE_FORMAT(o.order_date, '%Y-%m') as month,
                COUNT(o.order_id) as total_orders,
                SUM(o.total_amount) as total_revenue,
                AVG(o.total_amount) as avg_order_value,
                COUNT(DISTINCT o.customer_id) as unique_customers
            FROM Orders o
            WHERE o.order_date >= COALESCE(?, DATE_SUB(CURDATE(), INTERVAL 12 MONTH))
              AND o.order_date <= COALESCE(?, CURDATE())
            GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
            ORDER BY month ASC
        `,
        parameters: [
            {
                name: "start_date",
                type: "date",
                description: "Start date for trend analysis",
                required: false,
                default: null
            },
            {
                name: "end_date",
                type: "date",
                description: "End date for trend analysis",
                required: false,
                default: null
            }
        ],
        example_params: { start_date: "2023-01-01", end_date: "2024-12-31" },
        tags: ["sales", "trends", "monthly", "analytics"]
    },
    {
        id: "abandoned_cart_analysis",
        name: "Abandoned Cart Analysis",
        description: "Find customers with items in cart but no recent orders",
        category: "customer_behavior",
        sql: `
            SELECT TOP(@limit)
                c.customer_id,
                c.customer_name,
                c.email,
                COUNT(ci.item_id) as cart_items,
                SUM(ci.quantity * p.price) as cart_value,
                ci.created_date as cart_created,
                MAX(o.order_date) as last_order_date
            FROM CRM_Customer c
                     JOIN Cart_Items ci ON c.customer_id = ci.customer_id
                     JOIN Products p ON ci.product_id = p.product_id
                     LEFT JOIN Orders o ON c.customer_id = o.customer_id
            WHERE ci.created_date >= COALESCE(?, DATE_SUB(CURDATE(), INTERVAL 30 DAY))
              AND (o.order_date IS NULL OR o.order_date < ci.created_date)
            GROUP BY c.customer_id, c.customer_name, c.email, ci.created_date
            HAVING cart_value >= COALESCE(?, 0)
            ORDER BY cart_value DESC
        `,
        parameters: [
            {
                name: "cart_date_from",
                type: "date",
                description: "Only consider carts created from this date",
                required: false,
                default: null
            },
            {
                name: "min_cart_value",
                type: "number",
                description: "Minimum cart value to include",
                required: false,
                default: 0
            },
            {
                name: "limit",
                type: "number",
                description: "Maximum number of results",
                required: false,
                default: 100
            }
        ],
        example_params: { cart_date_from: "2024-06-01", min_cart_value: 50, limit: 25 },
        tags: ["cart", "abandoned", "customer_behavior"]
    }
];
export function registerQueryTemplateTools(server) {
    // Tool to list all available query templates
    server.registerTool("sql.list_templates", {
        title: "List Query Templates",
        description: "Get all available pre-built query templates",
        inputSchema: {
            category: z.string().optional().describe("Filter by category"),
            tag: z.string().optional().describe("Filter by tag")
        }
    }, async ({ category, tag }) => {
        try {
            let filteredTemplates = QUERY_TEMPLATES;
            if (category) {
                filteredTemplates = filteredTemplates.filter(t => t.category === category);
            }
            if (tag) {
                filteredTemplates = filteredTemplates.filter(t => t.tags.includes(tag));
            }
            const templateList = filteredTemplates.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                tags: t.tags,
                parameter_count: t.parameters.length
            }));
            return {
                content: [{
                        type: "text",
                        text: `Found ${templateList.length} query templates:\n\n${JSON.stringify(templateList, null, 2)}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error listing templates: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
    // Tool to get details about a specific template
    server.registerTool("sql.get_template", {
        title: "Get Query Template Details",
        description: "Get full details about a specific query template including SQL and parameters",
        inputSchema: {
            template_id: z.string().describe("The template ID to retrieve")
        }
    }, async ({ template_id }) => {
        try {
            const template = QUERY_TEMPLATES.find(t => t.id === template_id);
            if (!template) {
                throw new Error(`Template '${template_id}' not found`);
            }
            return {
                content: [{
                        type: "text",
                        text: `Template: ${template.name}\n\n${JSON.stringify(template, null, 2)}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error getting template: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
    // Tool to execute a query template
    server.registerTool("sql.execute_template", {
        title: "Execute Query Template",
        description: "Execute a pre-built query template with provided parameters",
        inputSchema: {
            template_id: z.string().describe("The template ID to execute"),
            parameters: z.record(z.any()).optional().describe("Parameters for the template as key-value pairs")
        }
    }, async ({ template_id, parameters = {} }) => {
        try {
            const template = QUERY_TEMPLATES.find(t => t.id === template_id);
            if (!template) {
                throw new Error(`Template '${template_id}' not found`);
            }
            // Validate and prepare parameters
            const sqlParams = [];
            for (const param of template.parameters) {
                let value = parameters[param.name];
                // Use default if not provided and not required
                if (value === undefined) {
                    if (param.required) {
                        throw new Error(`Required parameter '${param.name}' not provided`);
                    }
                    value = param.default;
                }
                // Type validation
                if (value !== null && value !== undefined) {
                    if (param.type === 'number' && typeof value !== 'number') {
                        value = Number(value);
                        if (isNaN(value)) {
                            throw new Error(`Parameter '${param.name}' must be a number`);
                        }
                    }
                }
                sqlParams.push(value);
            }
            // Execute the query
            const results = await query(template.sql, { sqlParams });
            return {
                content: [{
                        type: "text",
                        text: `Template '${template.name}' executed successfully.\nFound ${results.length} results:\n\n${JSON.stringify(results, null, 2)}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error executing template: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
    // Tool to search templates by description or tags
    server.registerTool("sql.search_templates", {
        title: "Search Query Templates",
        description: "Search for query templates by keywords in name, description, or tags",
        inputSchema: {
            search_term: z.string().describe("Keywords to search for"),
            search_in: z.enum(["all", "name", "description", "tags"]).default("all").describe("Where to search")
        }
    }, async ({ search_term, search_in }) => {
        try {
            const searchLower = search_term.toLowerCase();
            const matches = QUERY_TEMPLATES.filter(template => {
                if (search_in === "all" || search_in === "name") {
                    if (template.name.toLowerCase().includes(searchLower))
                        return true;
                }
                if (search_in === "all" || search_in === "description") {
                    if (template.description.toLowerCase().includes(searchLower))
                        return true;
                }
                if (search_in === "all" || search_in === "tags") {
                    if (template.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                        return true;
                }
                return false;
            });
            const searchResults = matches.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                tags: t.tags
            }));
            return {
                content: [{
                        type: "text",
                        text: `Found ${searchResults.length} templates matching "${search_term}":\n\n${JSON.stringify(searchResults, null, 2)}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error searching templates: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
}
