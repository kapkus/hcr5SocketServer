const express = require('express');
const router = express.Router();
const mongoClient = require('../mongo');

router.get('/', async (req, res, next) => {
    try {
        const client = await mongoClient(); 
        console.debug(client)

        res.status(200).json({ok: "ok"});


    } catch (err) {
        console.debug(err);
    }
});

module.exports = router;