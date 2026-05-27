const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { logger } = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// Map numeric severityScore to text label
const scoreLabelMap = {
  1: 'LOW',
  2: 'LOW',
  3: 'MEDIUM',
  4: 'HIGH',
  5: 'CRITICAL',
};

const analyzeDamage = async (filePath, mimeType) => {
  try {
    // Check file exists before sending
    if (!fs.existsSync(filePath)) {
      logger.warn(`AI: file not found at ${filePath}, skipping analysis`);
      return null;
    }

    // Health check (fast, non-blocking)
    await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 }).catch(() => {
      throw new Error('AI service not reachable');
    });

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath), {
      filename: 'image.jpg',
      contentType: mimeType || 'image/jpeg',
    });

    const response = await axios.post(`${AI_SERVICE_URL}/api/analyze`, form, {
      headers: { ...form.getHeaders() },
      timeout: 30000,
    });

    const data = response.data;

    if (data.error) {
      logger.error(`AI service error: ${data.error}`);
      return null;
    }

    // Normalize output to match what the frontend and DB expect:
    //   damageType (string), severity (text label), confidence (0-1 float)
    const result = {
      damageType: (data.damageType || 'UNKNOWN').toUpperCase(),
      severity: scoreLabelMap[data.severityScore] || data.severity || 'MEDIUM',
      severityScore: data.severityScore || 3,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
    };

    logger.info(`AI Result: ${JSON.stringify(result)}`);
    return result;

  } catch (err) {
    logger.error(`AI analysis failed: ${err.message}`);
    return null; // Graceful degradation - complaint still submitted without AI
  }
};

module.exports = { analyzeDamage };