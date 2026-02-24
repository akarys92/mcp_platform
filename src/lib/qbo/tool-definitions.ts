/**
 * QuickBooks Online tool definitions.
 * Each tool maps to one or more QBO API endpoints.
 * Used for:
 *  - Seeding the tools table when a QBO connector is created
 *  - Providing tool schemas in MCP tools/list responses
 */

export interface ToolDefinition {
  name: string;
  display_name: string;
  description: string;
  category: "read" | "write";
  input_schema: Record<string, unknown>;
}

export const QBO_TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Read Tools ──────────────────────────────────────────────────────

  {
    name: "get_invoices",
    display_name: "List Invoices",
    description:
      "Query invoices with optional filters for date range, customer, and status (paid, unpaid, overdue). Returns a summary list.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Filter invoices on or after this date (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "Filter invoices on or before this date (YYYY-MM-DD)",
        },
        customer_name: {
          type: "string",
          description: "Filter by customer name (partial match)",
        },
        status: {
          type: "string",
          enum: ["paid", "unpaid", "overdue"],
          description:
            "Filter by payment status. 'unpaid' = balance > 0, 'overdue' = unpaid and past due date, 'paid' = balance = 0",
        },
        max_results: {
          type: "number",
          description: "Maximum number of invoices to return (default: 100, max: 1000)",
        },
      },
    },
  },

  {
    name: "get_invoice_detail",
    display_name: "Invoice Detail",
    description:
      "Get full details for a specific invoice including line items, amounts, payment status, and customer info.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: "The QuickBooks invoice ID",
        },
      },
      required: ["invoice_id"],
    },
  },

  {
    name: "get_customers",
    display_name: "List Customers",
    description:
      "List all customers/clients with contact info and outstanding balances. Supports name search.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search customers by display name (partial match)",
        },
        active_only: {
          type: "boolean",
          description: "Only return active customers (default: true)",
        },
        max_results: {
          type: "number",
          description: "Maximum number of customers to return (default: 100)",
        },
      },
    },
  },

  {
    name: "get_payments",
    display_name: "List Payments",
    description:
      "List payments received, filterable by date range and customer.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Filter payments on or after this date (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "Filter payments on or before this date (YYYY-MM-DD)",
        },
        customer_name: {
          type: "string",
          description: "Filter by customer name (partial match)",
        },
        max_results: {
          type: "number",
          description: "Maximum number of payments to return (default: 100)",
        },
      },
    },
  },

  {
    name: "get_bills",
    display_name: "List Bills",
    description:
      "List vendor bills and their payment status. Status is derived from the balance: paid (balance = 0), unpaid (balance = total), or partially paid.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Filter bills on or after this date (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "Filter bills on or before this date (YYYY-MM-DD)",
        },
        vendor_name: {
          type: "string",
          description: "Filter by vendor name (partial match)",
        },
        unpaid_only: {
          type: "boolean",
          description: "Only return unpaid bills (default: false)",
        },
        max_results: {
          type: "number",
          description: "Maximum number of bills to return (default: 100)",
        },
      },
    },
  },

  {
    name: "get_profit_loss",
    display_name: "Profit & Loss Report",
    description:
      "Generate a Profit & Loss (income statement) report for a date range. Can optionally break down by month or quarter.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start of reporting period (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "End of reporting period (YYYY-MM-DD)",
        },
        summarize_by: {
          type: "string",
          enum: ["Total", "Month", "Quarter", "Year"],
          description:
            "How to break down the columns (default: Total — one column for the entire period)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },

  {
    name: "get_balance_sheet",
    display_name: "Balance Sheet",
    description:
      "Generate a Balance Sheet report showing assets, liabilities, and equity as of a given date.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        as_of_date: {
          type: "string",
          description:
            "Date for the balance sheet snapshot (YYYY-MM-DD). Defaults to today.",
        },
        summarize_by: {
          type: "string",
          enum: ["Total", "Month", "Quarter", "Year"],
          description: "How to break down the columns (default: Total)",
        },
      },
    },
  },

  {
    name: "get_accounts_receivable",
    display_name: "Accounts Receivable Aging",
    description:
      "Show an A/R aging summary: who owes what and how overdue. Breaks down by aging buckets (Current, 1-30, 31-60, 61-90, 91+ days).",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        as_of_date: {
          type: "string",
          description:
            "Report as-of date (YYYY-MM-DD). Defaults to today.",
        },
      },
    },
  },

  // ── Write Tools ─────────────────────────────────────────────────────

  {
    name: "create_invoice",
    display_name: "Create Invoice",
    description:
      "Create a new invoice for a customer with line items, amounts, and due date. Requires existing customer and item IDs from QuickBooks.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description:
            "QuickBooks customer ID. Use get_customers to find this.",
        },
        line_items: {
          type: "array",
          description: "Invoice line items",
          items: {
            type: "object",
            properties: {
              item_id: {
                type: "string",
                description:
                  "QuickBooks item/service ID. Must reference an existing item.",
              },
              quantity: { type: "number", description: "Quantity" },
              unit_price: {
                type: "number",
                description: "Price per unit",
              },
              description: {
                type: "string",
                description: "Line item description",
              },
            },
            required: ["item_id", "quantity", "unit_price"],
          },
        },
        due_date: {
          type: "string",
          description: "Payment due date (YYYY-MM-DD)",
        },
        invoice_date: {
          type: "string",
          description: "Invoice date (YYYY-MM-DD). Defaults to today.",
        },
        customer_email: {
          type: "string",
          description:
            "Customer email for sending the invoice. If set, the invoice can be emailed.",
        },
        memo: {
          type: "string",
          description: "Customer-facing memo/note on the invoice",
        },
      },
      required: ["customer_id", "line_items"],
    },
  },

  {
    name: "send_invoice",
    display_name: "Send Invoice",
    description:
      "Email an existing invoice to the customer. The invoice must have a billing email set, or you can override with a specific email address.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: "QuickBooks invoice ID to send",
        },
        email: {
          type: "string",
          description:
            "Override email address. If not provided, uses the email on the invoice.",
        },
      },
      required: ["invoice_id"],
    },
  },

  {
    name: "record_payment",
    display_name: "Record Payment",
    description:
      "Record a payment received against one or more outstanding invoices.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description:
            "QuickBooks customer ID. Must match the customer on the invoice(s).",
        },
        amount: {
          type: "number",
          description: "Total payment amount",
        },
        invoice_id: {
          type: "string",
          description:
            "QuickBooks invoice ID to apply this payment to. If omitted, payment is unapplied.",
        },
        payment_date: {
          type: "string",
          description: "Date payment was received (YYYY-MM-DD). Defaults to today.",
        },
        payment_method: {
          type: "string",
          description:
            "Payment method (e.g., 'Check', 'Credit Card', 'Cash', 'Bank Transfer')",
        },
        reference_number: {
          type: "string",
          description: "Check number or payment reference",
        },
      },
      required: ["customer_id", "amount"],
    },
  },

  {
    name: "create_customer",
    display_name: "Create Customer",
    description:
      "Add a new customer/client record in QuickBooks. Display name must be unique across all customers, vendors, and employees.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        display_name: {
          type: "string",
          description:
            "Unique display name for the customer. Must be unique across customers, vendors, and employees in QuickBooks.",
        },
        company_name: {
          type: "string",
          description: "Company/organization name",
        },
        email: {
          type: "string",
          description: "Primary email address",
        },
        phone: {
          type: "string",
          description: "Primary phone number",
        },
        billing_address: {
          type: "object",
          description: "Billing address",
          properties: {
            line1: { type: "string", description: "Street address" },
            city: { type: "string", description: "City" },
            state: {
              type: "string",
              description: "State/province code (e.g., 'CA', 'NY')",
            },
            postal_code: { type: "string", description: "ZIP/postal code" },
            country: {
              type: "string",
              description: "Country code (default: 'US')",
            },
          },
        },
      },
      required: ["display_name"],
    },
  },
];

/**
 * Seed tool rows for a newly connected QuickBooks connector.
 */
export function getToolSeedData(connectorId: string) {
  return QBO_TOOL_DEFINITIONS.map((def) => ({
    connector_id: connectorId,
    name: def.name,
    display_name: def.display_name,
    description: def.description,
    category: def.category,
    is_active: true,
    input_schema: def.input_schema,
  }));
}
