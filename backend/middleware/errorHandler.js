/**
 * Error Handling Middleware
 * Centralised error responses for the entire API
 */

/**
 * 404 Not Found handler - called when no route matches
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler - must have 4 parameters for Express to recognise it
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
    console.error(err.stack);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File is too large. Maximum size is 10MB.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Use "image" as the field name.',
    });
  }

  if (err.isAxiosError) {
    const service = err.config?.url || 'external service';
    const axiosStatus = err.response?.status;
    const apiError = err.response?.data?.error;
    const serviceMessage =
      (typeof apiError === 'string' && apiError) ||
      apiError?.message ||
      err.response?.data?.message ||
      err.message;

    if (!err.response) {
      return res.status(503).json({
        success: false,
        message: `Unable to reach ${service}. The AI service may be offline.`,
      });
    }

    return res.status(502).json({
      success: false,
      message: `Error from ${service}: ${serviceMessage}`,
      upstreamStatus: axiosStatus,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
