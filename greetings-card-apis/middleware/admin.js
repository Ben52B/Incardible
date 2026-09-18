const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const {error_response} = require('../utils/response');

// Admin tokens carry role: 'admin' (see controllers/admin/admin.js). Customer
// tokens are signed with the same key, so the role claim AND an Admin lookup
// are both required; a customer token must never pass this middleware.
const admin_token_verify = async (req, res, next) => {
    try {
        const token = req.headers['x-access-token'];
        if (!token) {
            return error_response(res, 401, "Authentication required");
        }
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        if (!decoded || decoded.role !== 'admin' || !decoded.id) {
            return error_response(res, 403, "Admin access required");
        }
        const admin = await Admin.findById(decoded.id).select('_id email name').lean();
        if (!admin) {
            return error_response(res, 403, "Admin access required");
        }
        req.admin = {id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin'};
        return next();
    } catch (error) {
        return error_response(res, 401, "Invalid or expired token");
    }
}
module.exports = admin_token_verify;
