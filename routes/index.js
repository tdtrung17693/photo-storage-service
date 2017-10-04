import express from "express";
import request from "request-promise";
import debug from "debug";

import { upload } from "../socket";

let router = express.Router();
let log = debug("photo-storage-service:socket-io");

/* GET home page. */
router.get("/", function(req, res) {
    res.render("index", { title: "Express" });
});

router.post("/", function(req, res) {
    let fileBuffer = req.files["photo"].data;

    let fileArrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength);

    upload(req.app, {
        name: req.files.photo.name,
        data: fileArrayBuffer
    }).then(() => {
        log("Photo broadcasted.");

        var options = {
            method: "POST",
            uri: "http://api.openfpt.vn/text2speech/v4",
            body: `${req.body.name} đã chấm công vào`,
            headers: {
                "api_key": "fc576c2dd6744c5497641aea0ed78769",
                "speed": 0,
                "voice": "hatieumai",
                "prosody": 1,
                "Cache-Control": "no-cache"
            },
            json: true
        };

        return request(options);

    }).then(parsedBody => {
        let options = {
            method: "GET",
            uri: parsedBody.async,
            encoding: null
        };

        return request(options);

    }).catch(function (err) {

        log(err);

    }).then(data => {
        return upload(req.app, {
            name: `${req.body.name}-checkin.mp3`,
            data: data.buffer.slice(
                data.byteOffset,
                data.byteOffset + data.byteLength
            )
        });
    }).then(() => {
        log("Audio checkin broadcasted");

        var options = {
            method: "POST",
            uri: "http://api.openfpt.vn/text2speech/v4",
            body: `${req.body.name} đã chấm công ra`,
            headers: {
                "api_key": "fc576c2dd6744c5497641aea0ed78769",
                "speed": 0,
                "voice": "hatieumai",
                "prosody": 1,
                "Cache-Control": "no-cache"
            },
            json: true
        };

        return request(options);

    }).then(parsedBody => {
        let options = {
            method: "GET",
            uri: parsedBody.async,
            encoding: null
        };

        return request(options);

    }).catch(function (err) {

        log(err);

    }).then(data => {
        return upload(req.app, {
            name: `${req.body.name}-checkin.mp3`,
            data: data.buffer.slice(
                data.byteOffset,
                data.byteOffset + data.byteLength
            )
        });
    }).then(() => {
        log("Audio checkout broadcasted");
    });

    res.end("123");
});

export default router;
