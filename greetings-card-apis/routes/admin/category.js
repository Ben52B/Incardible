const express = require('express');
const router = express.Router();
const {addCategory, editCategory, getAllCategories, destroyCategory} = require('../../controllers/admin/category');
const middleWare = require("../../middleware/admin");


router.post('/add',middleWare,  addCategory);
router.post('/edit',middleWare,  editCategory);
router.get('/get/all',  getAllCategories);
router.delete('/destroy/:id',middleWare,  destroyCategory);


module.exports = router;