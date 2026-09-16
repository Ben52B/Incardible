const Admin = require('../../models/admin');
const {success_response, error_response} = require('../../utils/response');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const Password = require("../../models/password");
const nodemailer = require("nodemailer");

// Admin accounts can only be created with the one-time setup key from the
// server environment (ADMIN_SETUP_KEY). Without it the endpoint is closed.
exports.register = async (req, res) => {
    try {
        const setupKey = process.env.ADMIN_SETUP_KEY;
        const provided = req.headers['x-admin-setup-key'];
        if (!setupKey || !provided || provided !== setupKey) {
            return error_response(res, 403, "Admin registration is disabled");
        }
        const {name, email, password} = req.body;
        if (typeof password !== 'string' || password.length < 10) {
            return error_response(res, 400, "Password must be at least 10 characters");
        }

        if (!(name && email && password)) {
            return error_response(res, 400, "All inputs are required!");
        }

        const oldUser = await Admin.findOne({email: email});

        if (oldUser) {
            return error_response(res, 400, "User already exist please login!");
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const create = await Admin.create({
            name,email,password:encryptedPassword

        })
        return success_response(res, 200, "Admin successfully registered", {id: create._id, name: create.name, email: create.email});
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.login = async (req, res) => {

    try {
        const {email, password} = req.body;

        if (!(email && password)) {
            return error_response(res, 400, "All inputs are required!");
        }

        const admin = await Admin.findOne({email});


        if (!admin) {
            return error_response(res, 400, "Admin not found!");
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return error_response(res, 400, "Invalid Credentials");
        }

        const payload = {id: admin._id, name: admin.name, email: admin.email, role: 'admin'};

        let jwtToken = jwt.sign(payload, process.env.TOKEN_KEY, {
            expiresIn: '24h',
        });

        const safeAdmin = admin.toObject();
        delete safeAdmin.password;
        safeAdmin.token = jwtToken;

        return success_response(res, 200, "Admin login successfully", safeAdmin);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.verify = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const admin = await Admin.findById({_id: adminId});

        if (!admin) {
            return error_response(res, 400, "Admin not found!");
        }

        const payload = {id: admin._id, name: admin.name, email: admin.email};

        let jwtToken = jwt.sign(payload, process.env.TOKEN_KEY, {
            expiresIn: '24h',
        });

        admin.token = jwtToken;

        return success_response(res, 200, "Admin successfully found", admin);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

//
// exports.forget = async (req, res) => {
//     try {
//         const authEmail = req.body.email;
//         const admin = await Admin.findOne({email: authEmail.toLowerCase()});
//
//         if (!admin) {
//             return error_response(res, 400, "Admin not found!");
//         }
//
//         const payload = {id: admin._id};
//
//         let jwtToken = jwt.sign(payload, process.env.TOKEN_KEY, {
//             expiresIn: process.env.TOKEN_EXPIRE,
//         });
//
//         admin.token = jwtToken;
//         // await user.save();
//         await Password.deleteMany({email: authEmail.toLowerCase()});
//
//         const created = await Password.create({
//             email: authEmail,
//             token: jwtToken,
//         });
//         const {MAIL_USER, MAIL_HOST, MAIL_PASS, MAIL_PORT, APP_URL, MAIL_FROM, APP_NAME} = process.env;
//
//         const appUrl = APP_URL + "/reset?token=" + jwtToken;
//
//         let transport = nodemailer.createTransport({
//             host: MAIL_HOST,
//             port: MAIL_PORT,
//             auth: {
//                 user: MAIL_USER,
//                 pass: MAIL_PASS
//             }
//         });
//         const mailOptions = {
//             from: `"${APP_NAME}" <${MAIL_FROM}>`,
//             to: created.email,
//             subject: 'Reset Your Account Password',
//             html: `<a href=${appUrl}>Click here to reset your password</a>`
//         };
//
//
//         transport.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.error('Error:', error);
//             } else {
//                 console.log('Email sent:', info.response);
//             }
//         });
//         return success_response(res, 200, "Email successfully sent", created);
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };
// exports.reset = async (req, res) => {
//     try {
//         const {token, confirmPassword} = req.body;
//         const findToken = await Password.findOne({token});
//
//         if (!findToken) {
//             return error_response(res, 400, "Invalid token");
//         }
//         const admin = await Admin.findOne({email: findToken.email});
//
//         if (!admin) {
//             return error_response(res, 400, "Admin not found!");
//         }
//
//         const encryptPassword = await bcrypt.hash(confirmPassword, 10);
//         admin.password = encryptPassword;
//         await admin.save();
//
//         await Password.deleteMany({email: findToken.email});
//         let userResponse = {
//             _id: admin._id,
//             name: admin.name,
//             email: admin.email,
//         };
//         return success_response(res, 200, "Password reset successfully", userResponse);
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };
