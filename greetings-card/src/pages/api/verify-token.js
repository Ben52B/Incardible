// pages/api/verify-token.js
import jwt from 'jsonwebtoken';

const secret = 'greetings-card-api-token-secure'
console.log("secret", secret)
export default function handler(req, res) {
  const token = req.body.token;

  console.log("token API", token);

  if (!token) return res.status(400).json({ success: false, message: "Token is required." });

  try {

    console.log("JWTTT: ", secret);

    const decoded = jwt.verify(token, secret);
    console.log(":decoded of verufy", decoded);
    return res.status(200).json({ success: true, decoded });
  } catch (error) {
    return res.status(401).json({ success: false, message: error });
  }
}
