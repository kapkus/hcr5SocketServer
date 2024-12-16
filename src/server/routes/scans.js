const express = require('express');
const router = express.Router();
const {ObjectId} = require("mongodb")
const mongoClient = require('../mongo');

router.get('/:id/ply', async (req, res, next) => {
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

router.get('/:id/bin', async (req, res, next) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid MongoDB ID' });
    }

    try {
        const client = await mongoClient();
        const collection = client.collection('scan_metadata'); 

        const document = await collection.findOne({ _id: new ObjectId(id) });

        client.close();


        console.log(document);
        
        // if (document) {
        // } else {
        //     res.status(404).json({ error: 'Document not found' });
        // }

        res.status(200).json({ok: "ok"});
    } catch (err) {
        next(err);
    }

    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'files', fileName);

})

router.delete('/:id', async (req, res, next) => {


})

// router.put('/', async (req, res) => {
//     try{
//         console.log(req.body)
//         // const settings = await Settings.find();
//         // res.json(settings)
//     } catch (err) {
//         errorResponseHandler();
//     }    
// });


module.exports = router;



