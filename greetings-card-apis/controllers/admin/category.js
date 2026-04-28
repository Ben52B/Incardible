const {success_response, error_response} = require('../../utils/response');
const Category = require("../../models/category");
const Cards = require("../../models/card");

exports.addCategory = async (req, res) => {
    try {
        const {name} = req.body;

        if (!name) {
            return error_response(res, 400, "Name is required!");
        }

        let category = await Category.findOne({name});

        if (category) {
            return error_response(res, 400, "Category already exist!", category);
        }

        category = await Category.create({
            name
        })
        return success_response(res, 200, "Category added successfully", category);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);

    }
}
exports.editCategory = async (req, res) => {
    try {
        const {id, name} = req.body;

        if (!(name && id)) {
            return error_response(res, 400, "All input is  required!");
        }

        let category = await Category.findOne({_id: id});

        if (!category) {
            return error_response(res, 400, "Category not found!");
        }

        category.name = name;
        await category.save();

        return success_response(res, 200, "Category updated successfully", category);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);

    }
};
exports.getAllCategories = async (req, res) => {
    try {

        let category = await Category.find({deleteCategory:false}).sort({createdAt:-1});
        return success_response(res, 200, "Category fetched successfully", category);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);

    }
};
exports.destroyCategory = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id) {
            return error_response(res, 400, "Id is required!");
        }

        // const category = await Category.findByIdAndDelete(id);

        // if (!category) {
        //     return error_response(res, 404, "Category not found!");
        // }
        const category = await Category.findOne({_id:id});

        if (!category) {
            return error_response(res, 404, "Category not found!");
        }
category.deleteCategory = true;
category.save();
        return success_response(res, 200, "Category deleted successfully");
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};