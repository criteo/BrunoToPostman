// src/utils/postman-id.js

/**
 * Generate a UUID v4 compatible ID for Postman collections
 * @returns {string} A UUID v4 string
 */
function generatePostmanId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  generatePostmanId
};