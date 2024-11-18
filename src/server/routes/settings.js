const express = require('express');
const router = express.Router();
const {ObjectId} = require("mongodb")
const mongoClient = require('../mongo');

router.get('/', async (req, res, next) => {
    try{
        const client = await mongoClient();
        const settings = client.collection('scanner_settings');
        
        // TODO rozważyc robienie tego - czy bede potrzebowac zapisywac 

        console.debug(settings);

        // let resObj = {};
        // if(user){
        //     resObj = {
        //         userId: user._id,
        //         name: user.name,
        //         userType: user.userType,
        //         settings: user.settings
        //     }
        // }

        res.status(200).json({ok: "ok"});
    } catch (err) {
        next(err);
    }
});

router.put('/', async (req, res) => {
    try{
        console.log(req.body)
        // const settings = await Settings.find();
        // res.json(settings)
    } catch (err) {
        errorResponseHandler();
    }    
});


const initSettings = () => {

}


module.exports = router;



