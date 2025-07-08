// Error tracking and logging utilities
export const logError = (error: Error, context?: string) => {
  console.error(`[${context || 'Unknown'}] Error:`, error);
  
  // In production, you might want to send to Sentry or another service
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // Sentry error reporting would go here
  }
};

export const logInfo = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(message, data);
  }
};

// API response helpers
export const createApiResponse = (data: unknown, success: boolean = true) => {
  return {
    success,
    data,
    timestamp: new Date().toISOString(),
  };
};

export const createApiError = (message: string, statusCode: number = 500) => {
  return {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};