const express = require('express');
const router = express.Router();
const {ObjectId} = require("mongodb")
const mongoClient = require('../mongo');

router.get('/', async (req, res, next) => {
    try{
        const client = await mongoClient();
        const scans = client.collection('scan_metadata');

        const scanList = await scans.find({}, {
            projection: {
                _id: 1,
                scanFileName: 1,
                startTime: 1,
                endTime: 1,
                currentWaypoint: 1,
                isComplete: 1
            }
        }).toArray();
       
        res.status(200).json(scanList);
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



