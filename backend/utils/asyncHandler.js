/**
 * Wrapper function to handle async errors in Express controllers
 * Eliminates need for try-catch in every route handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.data = null
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors
    }
  }
}

/**
 * Helper to send JSON responses
 */
export const sendResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    statusCode,
    message,
    data
  })
}
