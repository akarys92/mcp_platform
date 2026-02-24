import { QBOClient } from "../client";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createInvoice(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const lineItems = args.line_items as Array<{
    item_id: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }>;

  if (!lineItems || lineItems.length === 0) {
    throw new Error("At least one line item is required");
  }

  const invoice: any = {
    CustomerRef: { value: String(args.customer_id) },
    Line: lineItems.map((item, idx) => ({
      DetailType: "SalesItemLineDetail",
      Amount: item.quantity * item.unit_price,
      Description: item.description || "",
      LineNum: idx + 1,
      SalesItemLineDetail: {
        ItemRef: { value: String(item.item_id) },
        Qty: item.quantity,
        UnitPrice: item.unit_price,
      },
    })),
  };

  if (args.due_date) invoice.DueDate = String(args.due_date);
  if (args.invoice_date) invoice.TxnDate = String(args.invoice_date);
  if (args.customer_email) {
    invoice.BillEmail = { Address: String(args.customer_email) };
  }
  if (args.memo) {
    invoice.CustomerMemo = { value: String(args.memo) };
  }

  const result = await client.request("/invoice", {
    method: "POST",
    body: JSON.stringify(invoice),
  });

  const created = (result as any).Invoice;
  return {
    success: true,
    invoice_id: created.Id,
    doc_number: created.DocNumber,
    total: created.TotalAmt,
    customer: created.CustomerRef?.name,
  };
}

export async function sendInvoice(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const invoiceId = String(args.invoice_id);
  const emailParam = args.email
    ? `?sendTo=${encodeURIComponent(String(args.email))}`
    : "";

  // QBO send endpoint uses application/octet-stream Content-Type
  const result = await client.request(
    `/invoice/${invoiceId}/send${emailParam}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: "",
    }
  );

  const invoice = (result as any).Invoice;
  return {
    success: true,
    invoice_id: invoice.Id,
    doc_number: invoice.DocNumber,
    sent_to: invoice.BillEmail?.Address,
    email_status: invoice.EmailStatus,
  };
}

export async function recordPayment(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const payment: any = {
    CustomerRef: { value: String(args.customer_id) },
    TotalAmt: Number(args.amount),
    TxnDate:
      String(args.payment_date || new Date().toISOString().split("T")[0]),
  };

  // Link to specific invoice if provided
  if (args.invoice_id) {
    payment.Line = [
      {
        Amount: Number(args.amount),
        LinkedTxn: [
          {
            TxnId: String(args.invoice_id),
            TxnType: "Invoice",
          },
        ],
      },
    ];
  }

  if (args.reference_number) {
    payment.PaymentRefNum = String(args.reference_number);
  }

  const result = await client.request("/payment", {
    method: "POST",
    body: JSON.stringify(payment),
  });

  const created = (result as any).Payment;
  return {
    success: true,
    payment_id: created.Id,
    amount: created.TotalAmt,
    customer: created.CustomerRef?.name,
    date: created.TxnDate,
  };
}

export async function createCustomer(
  client: QBOClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const customer: any = {
    DisplayName: String(args.display_name),
  };

  if (args.company_name)
    customer.CompanyName = String(args.company_name);
  if (args.email)
    customer.PrimaryEmailAddr = { Address: String(args.email) };
  if (args.phone)
    customer.PrimaryPhone = { FreeFormNumber: String(args.phone) };

  if (args.billing_address) {
    const addr = args.billing_address as Record<string, unknown>;
    customer.BillAddr = {
      Line1: addr.line1 ? String(addr.line1) : undefined,
      City: addr.city ? String(addr.city) : undefined,
      CountrySubDivisionCode: addr.state ? String(addr.state) : undefined,
      PostalCode: addr.postal_code ? String(addr.postal_code) : undefined,
      Country: addr.country ? String(addr.country) : "US",
    };
  }

  const result = await client.request("/customer", {
    method: "POST",
    body: JSON.stringify(customer),
  });

  const created = (result as any).Customer;
  return {
    success: true,
    customer_id: created.Id,
    display_name: created.DisplayName,
    balance: created.Balance,
  };
}
