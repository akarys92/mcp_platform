export class QBOError extends Error {
  constructor(
    public statusCode: number,
    public response: unknown
  ) {
    super(
      `QuickBooks API error (${statusCode}): ${JSON.stringify(response).slice(0, 500)}`
    );
    this.name = "QBOError";
  }
}
