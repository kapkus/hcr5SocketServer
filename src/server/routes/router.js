const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const settingsRouter = require('./settings');

router.use('/login', authRouter);
router.use('/settings', settingsRouter);

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