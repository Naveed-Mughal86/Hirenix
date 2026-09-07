Log-it questions
Write your answers before moving on. These are not graded — they are for your own record.

**You add a new PaymentRequiredError (HTTP 402) for a future billing feature. Write the complete class definition. What is the only file you need to change?**

1. PaymentRequiredError
export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required') {
    super(402, 'PAYMENT_REQUIRED', message);
  }
}

Only src/shared/errors.ts needs to be changed because the central error handler already handles all AppError subclasses.

**A route calls await someService.doThing() and the service throws a ConflictError. You do not have a try/catch in the route handler. In Express 4, does the error reach the error handler — and why or why not? What would you need to add to guarantee it does?**

Express 4 does not automatically catch errors from rejected promises in async route handlers. I need to use try/catch and pass the error to next(err) to ensure it reaches the central error handler.

**Your error handler logs the full error with console.error on 500s. In a production system with structured logging (e.g. sending logs to Datadog or CloudWatch), what would you pass to the logger instead of just the raw err object to make the log entry useful?**

Instead of logging only the raw error, structured logging should include useful context such as the error message, stack trace, request ID, route, HTTP method, timestamp, and severity level.

Quick quiz
**Q1. A teammate calls your jobsService.getJob() from a CLI script — not from an Express route handler. The service throws new NotFoundError('Job not found'). There is no error handler in scope. What happens? What does your teammate need to add to their script to handle this gracefully, and what would the handling look like given that NotFoundError is an AppError with statusCode and code properties?**

If a service throws an AppError in a CLI script, there is no Express error handler to catch it. The script should use try/catch and handle properties such as statusCode, code, and message.

**Q2. You register the error handler before your routes:
app.use(errorHandler);         // registered first
app.use('/jobs', jobsRouter);  // registered second
What happens when a route in jobsRouter calls next(new NotFoundError('...'))? Why?**

The error handler must be registered after all routes. Express processes middleware in order, so an error handler registered before routes will not catch errors from routes registered later.

**Q3. In production (NODE_ENV=production), an unexpected database connection error — Error: connect ECONNREFUSED 127.0.0.1:5432 — reaches the error handler. What does the client receive in the response body? What does the server log? Why are these two things different from each other?**

For unexpected errors, the server logs the complete error for debugging, while the client receives a generic 500 response. This prevents internal database or server details from being exposed to users.