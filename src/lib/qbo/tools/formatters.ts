/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Format a QBO report (P&L, Balance Sheet, A/R Aging) into readable text.
 * QBO reports return deeply nested Row/Column/ColData structures.
 */
export function formatReportData(report: any): string {
  const header = report.Header || {};
  const columns =
    report.Columns?.Column?.map((c: any) => c.ColTitle || "") || [];

  let output = `${header.ReportName || "Report"}`;
  if (header.StartPeriod && header.EndPeriod) {
    output += ` (${header.StartPeriod} to ${header.EndPeriod})`;
  } else if (header.EndPeriod) {
    output += ` (as of ${header.EndPeriod})`;
  }
  output += "\n";

  if (columns.length > 0) {
    output += columns.join(" | ") + "\n";
    output += "-".repeat(Math.min(80, columns.join(" | ").length)) + "\n";
  }

  function processRows(rows: any[], indent: number = 0): void {
    for (const row of rows || []) {
      // Header row (section name)
      if (row.Header?.ColData) {
        const values = row.Header.ColData.map((c: any) => c.value || "");
        output += " ".repeat(indent) + values.join(" | ") + "\n";
      }

      // Data rows
      if (row.ColData) {
        const values = row.ColData.map((c: any) => c.value || "");
        output += " ".repeat(indent) + values.join(" | ") + "\n";
      }

      // Nested rows
      if (row.Rows?.Row) {
        processRows(row.Rows.Row, indent + 2);
      }

      // Summary row
      if (row.Summary?.ColData) {
        const values = row.Summary.ColData.map((c: any) => c.value || "");
        output += " ".repeat(indent) + "[Total] " + values.join(" | ") + "\n";
      }
    }
  }

  processRows(report.Rows?.Row);
  return output;
}

/**
 * Format a list of invoices into simplified objects.
 */
export function formatInvoiceList(invoices: any[]): unknown[] {
  const now = new Date();
  return invoices.map((inv: any) => ({
    id: inv.Id,
    doc_number: inv.DocNumber,
    customer: inv.CustomerRef?.name,
    customer_id: inv.CustomerRef?.value,
    date: inv.TxnDate,
    due_date: inv.DueDate,
    total: inv.TotalAmt,
    balance: inv.Balance,
    status:
      inv.Balance === 0
        ? "Paid"
        : inv.DueDate && new Date(inv.DueDate) < now
          ? "Overdue"
          : "Unpaid",
    email_status: inv.EmailStatus,
  }));
}

/**
 * Format full invoice detail including line items.
 */
export function formatInvoiceDetail(invoice: any): unknown {
  return {
    id: invoice.Id,
    doc_number: invoice.DocNumber,
    customer: invoice.CustomerRef?.name,
    customer_id: invoice.CustomerRef?.value,
    date: invoice.TxnDate,
    due_date: invoice.DueDate,
    total: invoice.TotalAmt,
    balance: invoice.Balance,
    status:
      invoice.Balance === 0
        ? "Paid"
        : invoice.DueDate && new Date(invoice.DueDate) < new Date()
          ? "Overdue"
          : "Unpaid",
    billing_email: invoice.BillEmail?.Address,
    customer_memo: invoice.CustomerMemo?.value,
    private_note: invoice.PrivateNote,
    email_status: invoice.EmailStatus,
    sync_token: invoice.SyncToken,
    line_items: (invoice.Line || [])
      .filter((line: any) => line.DetailType === "SalesItemLineDetail")
      .map((line: any) => ({
        description: line.Description,
        amount: line.Amount,
        quantity: line.SalesItemLineDetail?.Qty,
        unit_price: line.SalesItemLineDetail?.UnitPrice,
        item: line.SalesItemLineDetail?.ItemRef?.name,
        item_id: line.SalesItemLineDetail?.ItemRef?.value,
      })),
    created: invoice.MetaData?.CreateTime,
    last_updated: invoice.MetaData?.LastUpdatedTime,
  };
}

/**
 * Format a list of customers into simplified objects.
 */
export function formatCustomerList(customers: any[]): unknown[] {
  return customers.map((c: any) => ({
    id: c.Id,
    display_name: c.DisplayName,
    company_name: c.CompanyName,
    email: c.PrimaryEmailAddr?.Address,
    phone: c.PrimaryPhone?.FreeFormNumber,
    balance: c.Balance,
    active: c.Active,
  }));
}

/**
 * Format a list of payments.
 */
export function formatPaymentList(payments: any[]): unknown[] {
  return payments.map((p: any) => ({
    id: p.Id,
    customer: p.CustomerRef?.name,
    customer_id: p.CustomerRef?.value,
    amount: p.TotalAmt,
    date: p.TxnDate,
    unapplied_amount: p.UnappliedAmt,
    payment_method: p.PaymentMethodRef?.name,
    linked_invoices: (p.Line || [])
      .flatMap((line: any) =>
        (line.LinkedTxn || [])
          .filter((txn: any) => txn.TxnType === "Invoice")
          .map((txn: any) => txn.TxnId)
      ),
  }));
}

/**
 * Format a list of bills.
 */
export function formatBillList(bills: any[]): unknown[] {
  return bills.map((b: any) => ({
    id: b.Id,
    vendor: b.VendorRef?.name,
    vendor_id: b.VendorRef?.value,
    date: b.TxnDate,
    due_date: b.DueDate,
    total: b.TotalAmt,
    balance: b.Balance,
    status:
      b.Balance === 0
        ? "Paid"
        : b.Balance === b.TotalAmt
          ? "Unpaid"
          : "Partially Paid",
  }));
}
