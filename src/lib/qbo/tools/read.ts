import { QBOClient } from "../client";
import {
  formatInvoiceList,
  formatInvoiceDetail,
  formatCustomerList,
  formatPaymentList,
  formatBillList,
  formatReportData,
} from "./formatters";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getInvoices(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const conditions: string[] = [];

  if (args.start_date) conditions.push(`TxnDate >= '${args.start_date}'`);
  if (args.end_date) conditions.push(`TxnDate <= '${args.end_date}'`);
  if (args.customer_name) {
    // QBO LIKE only supports % wildcard, no single-char wildcard
    conditions.push(
      `CustomerRef LIKE '%${String(args.customer_name).replace(/'/g, "\\'")}%'`
    );
  }

  // Status filtering — QBO doesn't support OR, so we filter by conditions
  if (args.status === "paid") {
    conditions.push(`Balance = '0'`);
  } else if (args.status === "unpaid") {
    conditions.push(`Balance > '0'`);
  } else if (args.status === "overdue") {
    conditions.push(`Balance > '0'`);
    conditions.push(
      `DueDate < '${new Date().toISOString().split("T")[0]}'`
    );
  }

  const where =
    conditions.length > 0 ? conditions.join(" AND ") : undefined;
  const maxResults = Number(args.max_results) || 100;

  const result = await client.query(
    "Invoice",
    where,
    "TxnDate DESC",
    maxResults
  );
  const invoices = (result as any).QueryResponse?.Invoice || [];
  return formatInvoiceList(invoices);
}

export async function getInvoiceDetail(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const result = await client.request(`/invoice/${args.invoice_id}`);
  return formatInvoiceDetail((result as any).Invoice);
}

export async function getCustomers(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const conditions: string[] = [];

  if (args.search) {
    conditions.push(
      `DisplayName LIKE '%${String(args.search).replace(/'/g, "\\'")}%'`
    );
  }
  if (args.active_only !== false) {
    conditions.push(`Active = true`);
  }

  const where =
    conditions.length > 0 ? conditions.join(" AND ") : undefined;
  const maxResults = Number(args.max_results) || 100;

  const result = await client.query(
    "Customer",
    where,
    "DisplayName",
    maxResults
  );
  const customers = (result as any).QueryResponse?.Customer || [];
  return formatCustomerList(customers);
}

export async function getPayments(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const conditions: string[] = [];

  if (args.start_date) conditions.push(`TxnDate >= '${args.start_date}'`);
  if (args.end_date) conditions.push(`TxnDate <= '${args.end_date}'`);
  if (args.customer_name) {
    conditions.push(
      `CustomerRef LIKE '%${String(args.customer_name).replace(/'/g, "\\'")}%'`
    );
  }

  const where =
    conditions.length > 0 ? conditions.join(" AND ") : undefined;
  const maxResults = Number(args.max_results) || 100;

  const result = await client.query(
    "Payment",
    where,
    "TxnDate DESC",
    maxResults
  );
  const payments = (result as any).QueryResponse?.Payment || [];
  return formatPaymentList(payments);
}

export async function getBills(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const conditions: string[] = [];

  if (args.start_date) conditions.push(`TxnDate >= '${args.start_date}'`);
  if (args.end_date) conditions.push(`TxnDate <= '${args.end_date}'`);
  if (args.vendor_name) {
    conditions.push(
      `VendorRef LIKE '%${String(args.vendor_name).replace(/'/g, "\\'")}%'`
    );
  }
  if (args.unpaid_only) {
    conditions.push(`Balance > '0'`);
  }

  const where =
    conditions.length > 0 ? conditions.join(" AND ") : undefined;
  const maxResults = Number(args.max_results) || 100;

  const result = await client.query(
    "Bill",
    where,
    "TxnDate DESC",
    maxResults
  );
  const bills = (result as any).QueryResponse?.Bill || [];
  return formatBillList(bills);
}

export async function getProfitLoss(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const params = new URLSearchParams({
    start_date: String(args.start_date),
    end_date: String(args.end_date),
  });
  if (args.summarize_by) {
    params.set("summarize_column_by", String(args.summarize_by));
  }

  const result = await client.request(`/reports/ProfitAndLoss?${params}`);
  return formatReportData(result);
}

export async function getBalanceSheet(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const params = new URLSearchParams();
  if (args.as_of_date) {
    params.set("end_date", String(args.as_of_date));
  }
  if (args.summarize_by) {
    params.set("summarize_column_by", String(args.summarize_by));
  }

  const paramStr = params.toString();
  const path = paramStr
    ? `/reports/BalanceSheet?${paramStr}`
    : "/reports/BalanceSheet";

  const result = await client.request(path);
  return formatReportData(result);
}

export async function getAccountsReceivable(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const params = new URLSearchParams();
  if (args.as_of_date) {
    params.set("report_date", String(args.as_of_date));
  }

  const paramStr = params.toString();
  const path = paramStr
    ? `/reports/AgedReceivableDetail?${paramStr}`
    : "/reports/AgedReceivableDetail";

  const result = await client.request(path);
  return formatReportData(result);
}
