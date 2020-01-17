const express = require('express');
const jsonfile = require("jsonfile");
const path = require("path");
const Omx = require("node-omxplayer");

const app = express();
const port = 3000;
var invertals = {};

//
app.use(express.static(__dirname + path.join("/", "views")));
app.use(express.static(__dirname + path.join("/", "node_modules")));

var player = Omx("./views/assets/mp3/Jingle.mp3")

app.get('/', (req, res) => {
    res.sendFile("index.html");

});
/**
 * 
 */

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});