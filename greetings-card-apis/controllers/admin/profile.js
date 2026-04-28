const Admin = require('../../models/admin');
const {success_response, error_response} = require('../../utils/response');
const bcrypt = require('bcryptjs');

exports.profile_update_password = async (req, res) => {
    try {

        const adminId = req.admin.id;
        const {oldPassword, newPassword, reTypeNewPassword} = req.body;

        if (!(oldPassword && newPassword && reTypeNewPassword)) {
            return error_response(res, 400, "All inputs are required!");
        }
        const findAdmin = await Admin.findOne({_id: adminId});

        if (!findAdmin) {
            return error_response(res, 400, "User not found!");
        }
        const comparePassword = await bcrypt.compare(oldPassword, findAdmin.password);

        if (!comparePassword) {
            return error_response(res, 400, "Old password not matched!");
        }

        let encryptPassword;

        if (newPassword === reTypeNewPassword) {
            encryptPassword = await bcrypt.hash(newPassword, 10);
            findAdmin.password = encryptPassword;
            await findAdmin.save();

        } else {
            return error_response(res, 400, "New password and retype password are not same");
        }
        const responseUser = {
            _id: findAdmin._id,
            name: findAdmin.name,
            email: findAdmin.email,
        };
        return success_response(res, 200, "Password updated successfully", responseUser);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }

};
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.profile_update_email = async (req, res) => {
    try {
        const { currentEmail, newEmail, name } = req.body;
        if (!currentEmail || !newEmail || !name) {
            return error_response(res, 400, "All inputs are required!");
        }

        const adminEmail = await Admin.findOne({
            email: { $regex: `^${escapeRegex(currentEmail.trim())}$`, $options: 'i' }
        });

        if (!adminEmail) {
            return error_response(res, 400, "Email not matched!");
        }

        adminEmail.email = newEmail.trim().toLowerCase();
        adminEmail.name = name.trim();
        await adminEmail.save();

        // const {currentEmail, newEmail, name} = req.body;
        //
        // console.log("req.body", req.body)
        //
        // if (!(currentEmail && newEmail && name)) {
        //     return error_response(res, 400, "All inputs are required!");
        // }
        // const adminEmail = await Admin.findOne({email: currentEmail.toLowerCase()});
        //
        // console.log("adminEmail", adminEmail)
        // if (!adminEmail) {
        //     return error_response(res, 400, "Email not matched!");
        // }
        //
        // const email = newEmail.toLowerCase();
        // adminEmail.email = email;
        // adminEmail.name = name;
        // await adminEmail.save();

        return success_response(res, 200, "Email updated successfully", adminEmail);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};