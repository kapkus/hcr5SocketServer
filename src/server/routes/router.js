const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const scansRouter = require('./scans');
const scanRouter = require('./scan');

router.use('/login', authRouter);
router.use('/scans', scansRouter);
router.use('/scan', scanRouter);

// router.get('/', async (req, res, next) => {
//     try {
//         const client = await mongoClient(); 
//         console.debug(client)

//         res.status(200).json({ok: "okaaaaa"});


//     } catch (err) {
//         console.debug(err);
//     }
// });

module.exports = router;