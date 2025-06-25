const fetch = require('node-fetch');

exports.handler = async function (event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": process.env.MY_SITE_URL || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: "Method Not Allowed",
    };
  }

  try {
    const { token } = JSON.parse(event.body || "{}");

    if (!token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: "Token missing" }),
      };
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const scoreThreshold = parseFloat(process.env.SCORE_THRESHOLD || "0.5");

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });

    const data = await response.json();

    if (data.success && data.score >= scoreThreshold) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, score: data.score }),
      };
    } else {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: "Verification failed",
          score: data.score,
        }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
