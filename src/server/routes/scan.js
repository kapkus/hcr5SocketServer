const express = require('express');
const router = express.Router();
const {ObjectId} = require("mongodb")
const mongoClient = require('../mongo');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const binaryScanToPly = require('../services/binaryScanToPly');

router.get('/:id/ply', async (req, res, next) => {
    try {
        const id = req.params.id;
        const scansDir = config.scansDir;
        const client = await mongoClient();
        const collection = client.collection('scan_metadata');

        const scan = await collection.findOne(
            { _id: new ObjectId(id) },
            { projection: { scanFileName: 1 } }
        );
        const filePath = path.join(scansDir, `${scan.scanFileName}.bin`);

        if(!fs.existsSync(filePath)){
            throw { code: "ERR_005" };
        }

        const outputPlyFile = binaryScanToPly(filePath);
        

        res.sendFile(filePath, (err) => {
            if (err) {
                throw { code: "ERR_006" };
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/bin', async (req, res, next) => {
    try {
        const id = req.params.id;
        const scansDir = config.scansDir;
        const client = await mongoClient();
        const collection = client.collection('scan_metadata');

        const scan = await collection.findOne(
            { _id: new ObjectId(id) },
            { projection: { scanFileName: 1 } }
        );

        const filePath = path.join(scansDir, `${scan.scanFileName}.bin`);

        if(!fs.existsSync(filePath)){
            throw { code: "ERR_005" };
        }

        res.sendFile(filePath, (err) => {
            if (err) {
                throw { code: "ERR_006" };
            }
        });
    } catch (error) {
        next(error);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const scansDir = config.scansDir;
        const client = await mongoClient();
        const collection = client.collection('scan_metadata'); 

        const scan = await collection.findOne(
            { _id: new ObjectId(id) },
            { projection: { scanFileName: 1 } }
        );

        const filePath = path.join(scansDir, scan.scanFileName);

        if(fs.existsSync(`${filePath}.bin`)){
            await fs.promises.unlink(`${filePath}.bin`);
        }
        
        if(fs.existsSync(`${filePath}.ply`)){
            await fs.promises.unlink(`${filePath}.ply`);
        }

        await collection.deleteOne({ _id: new ObjectId(id) });

        res.status(200).json({});
    } catch (err) {
        next(err);
    }
})




module.exports = router;



