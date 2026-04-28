
const {success_response, error_response} = require('../../utils/response');
const {send_contact_email} = require('../../utils/email');
const Contact = require('../../models/contactUs');

exports.contactUs = async (req, res) => {
    try {
        const {name, email, phoneNumber, message} = req.body;

        if (!(name && email && phoneNumber && message)) {
            return error_response(res, 400, "All inputs are required!");
        }

        const contactUs = await Contact.create({email, phoneNumber, message, name});

        const CONTACT_TO = process.env.CONTACT_TO || process.env.MAIL_USER;

        await send_contact_email(
            {
                MAIL_USER: process.env.MAIL_USER,
                MAIL_HOST: process.env.MAIL_HOST,
                MAIL_PASS: process.env.MAIL_PASS,
                MAIL_PORT: process.env.MAIL_PORT,
                MAIL_FROM: process.env.MAIL_FROM,
                APP_NAME: process.env.APP_NAME,
            },
            { to: CONTACT_TO, name, email, phoneNumber, message });


        return success_response(res, 200, "Message send to admin successfully", contactUs);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
