/**
 * asyncHandler - Wraps an async Express route handler and forwards any errors to `next`.
 * This utility helps avoid duplicated try/catch blocks in each controller.
 *
 * @param {Function} fn - An async function with signature (req, res, next).
 * @returns {Function} Express compatible middleware.
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
