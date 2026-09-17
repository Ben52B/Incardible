const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const {error_response} = require('../utils/response');

// Accepts either an admin token (sets req.admin) or a customer token
// (sets req.user). Controllers must enforce ownership when req.admin is absent.
module.exports = async function userOrAdmin(req, res, next) {
    try {
        const token = req.headers['x-access-token'];
        if (!token) return error_response(res, 401, "Authentication required");
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        if (decoded && decoded.role === 'admin' && decoded.id) {
            const admin = await Admin.findById(decoded.id).select('_id email name').lean();
            if (admin) {
                req.admin = {id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin'};
                return next();
            }
        }
        if (decoded && decoded.user_id) {
            req.user = decoded;
            return next();
        }
        return error_response(res, 401, "Invalid token");
    } catch (error) {
        return error_response(res, 401, "Invalid or expired token");
    }
};
