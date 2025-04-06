// logging.js

// Store logs in array
let requestLogs = [];

// Global flag for enabling/disabling logging
let isLoggingEnabled = false;

/**
 * Enables request logging for all subsequent axios requests
 */
function enable_request_logging() {
  isLoggingEnabled = true;
}

/**
 * Disables request logging for all subsequent axios requests
 */
function disable_request_logging() {
  isLoggingEnabled = false;
}

/**
 * Returns the current list of logged requests
 * @returns {Array} - Array of request log entries
 */
function get_request_log() {
  return [...requestLogs]; // returns a copy to prevent direct mutation
}

/**
 * Clears all log entries
 */
function clear_request_log() {
  requestLogs = [];
}

/**
 * Sets up the request and response interceptors for axios
 * @param {Object} axios - The axios instance to add logging to
 */
function setUpInterceptors(axios) {
  // request interceptor to capture the URL and method
  const requestInterceptor = axios.interceptors.request.use(
    function (config) {
      // Store the request data in config object
      if (isLoggingEnabled) {
        config._requestLogData = {
          method: config.method ? config.method.toUpperCase() : "UNKNOWN",
          url: config.url ? config.url : "UNKNOWN",
        };
      }
      return config;
    },
    (error) => {
      console.error("Request Interceptor Error:", error);
      return Promise.reject(error);
    }
  );

  // response interceptor to capture the status code
  const responseInterceptor = axios.interceptors.response.use(
    function (response) {
      // check if logging is enabled and if response.config._requestLogData exists
      if (isLoggingEnabled && response.config._requestLogData) {
        const logEntry = {
          ...response.config._requestLogData,
          status: response.status,
        };
        requestLogs.push(logEntry);
      }
      return response;
    },
    (error) => {
      // check if logging is enabled and if error.config._requestLogData exist
      if (isLoggingEnabled && error.config._requestLogData) {
        const logEntry = {
          ...error.config._requestLogData,
          status: error.response ? error.response.status : "500", // status code 500 is generic error code
        };
        requestLogs.push(logEntry);
      }
      return Promise.reject(error);
    }
  );

  // returns reset / clean up interceptors function since Axios does not automatically clean them up
  return function resetInterceptors() {
    axios.interceptors.request.eject(requestInterceptor);
    axios.interceptors.response.eject(responseInterceptor);
  };
}

export {
  enable_request_logging,
  disable_request_logging,
  get_request_log,
  clear_request_log,
  setUpInterceptors,
};
