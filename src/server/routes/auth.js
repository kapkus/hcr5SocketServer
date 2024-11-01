const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userValidator = require('./validators/auth.validator');
const validateBody = require('../middleware/validateBody');
const mongoClient = require('../config/mongo');
const config = require('../config/config');

router.post('/', validateBody(userValidator), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const client = await mongoClient();
        const collection = client.collection('users');
        const user = await collection.findOne({name: username});

        if (!user) {
            throw {code: "ERR_001"}
        }
        const passwordMatch = password === user.login_pw;
        if (!passwordMatch) {
            throw {code: "ERR_002"}
        }

        const token = jwt.sign({ userId: user._id }, config.JWT.SECRET, {
            expiresIn: config.JWT.JWT_EXPIRE_TIME || '1h'
        });
        res.status(200).json({ token });
    } catch (err) {
        next(err);
    }
});

module.exports = router;