import { QBOClient } from "./client";
import * as readTools from "./tools/read";
import * as writeTools from "./tools/write";

type ToolHandler = (
  client: QBOClient,
  args: Record<string, unknown>
) => Promise<unknown>;

const TOOL_MAP: Record<string, ToolHandler> = {
  get_invoices: readTools.getInvoices,
  get_invoice_detail: readTools.getInvoiceDetail,
  get_customers: readTools.getCustomers,
  get_payments: readTools.getPayments,
  get_bills: readTools.getBills,
  get_profit_loss: readTools.getProfitLoss,
  get_balance_sheet: readTools.getBalanceSheet,
  get_accounts_receivable: readTools.getAccountsReceivable,
  create_invoice: writeTools.createInvoice,
  send_invoice: writeTools.sendInvoice,
  record_payment: writeTools.recordPayment,
  create_customer: writeTools.createCustomer,
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
