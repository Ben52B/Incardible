const jwt = require('jsonwebtoken');
const {error_response} = require('../utils/response');

const verify_token = async (req, res, next) => {
    try {
        const token = req.headers['x-access-token'];
        if (!token) {
            return error_response(res, 401, "Authentication required");
        }
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        if (!decoded || !decoded.user_id) {
            return error_response(res, 401, "Invalid token");
        }
        req.user = decoded;
    } catch (error) {
        return error_response(res, 401, "Invalid or expired token");
    }
    return next();
}
module.exports = verify_token;
