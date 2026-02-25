import { QBOClient } from "./client";
import * as readTools from "./tools/read";
import * as writeTools from "./tools/write";

type ToolHandler = (
  client: QBOClient,
  args: Record<string, unknown>
) => Promise<unknown>;

const TOOL_MAP: Record<string, ToolHandler> = {
  qb_get_invoices: readTools.getInvoices,
  qb_get_invoice_detail: readTools.getInvoiceDetail,
  qb_get_customers: readTools.getCustomers,
  qb_get_payments: readTools.getPayments,
  qb_get_bills: readTools.getBills,
  qb_get_profit_loss: readTools.getProfitLoss,
  qb_get_balance_sheet: readTools.getBalanceSheet,
  qb_get_accounts_receivable: readTools.getAccountsReceivable,
  qb_create_invoice: writeTools.createInvoice,
  qb_send_invoice: writeTools.sendInvoice,
  qb_record_payment: writeTools.recordPayment,
  qb_create_customer: writeTools.createCustomer,
};

/**
 * Execute a QuickBooks tool by name.
 * Creates a QBOClient from the connector's stored credentials,
 * then delegates to the appropriate tool handler.
 */
export async function executeQBOTool(
  toolName: string,
  args: Record<string, unknown>,
  connectorId: string
): Promise<unknown> {
  const handler = TOOL_MAP[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const client = await QBOClient.fromConnector(connectorId);
  return handler(client, args);
}
