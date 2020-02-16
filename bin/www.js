var express = require('express');
var path = require('path');
var open = require('open');
var app = express();
var port = 3000;
app.use("/public",express.static(path.resolve("public")));
app.use("/dist",express.static(path.resolve("dist")));
app.listen(port,function(){
    console.log("[server] listeing on "+port)
    open(
        'http://127.0.0.1:'+port+"/public/index.html", 
        {app: ['chrome', '--incognito']}
    );
});
