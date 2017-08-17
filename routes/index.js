import express from "express";
import fs from "fs";
import { upload } from "../socket";

let router = express.Router();

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
    });


    res.end("123");
});

export default router;
