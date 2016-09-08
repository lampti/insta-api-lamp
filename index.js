var Crawler = require("crawler");
var url = require('url');
var express = require('express');
var cors = require('cors');

var app = express();

app.use(cors());

app.get('/', function (req, res) {
    var hashtag = req.query.hash;
    
    var c = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page 
        callback : function (error, result, $) {
            var item = $("script[type=\"text/javascript\"]").filter(function() {
              return $(this).text().indexOf('window._sharedData') > -1;
            }).text();
            item = item.replace(/(window._sharedData = )/g,"");
            item = item.replace(/(;)/g,"");
            
            var data = JSON.parse(item)
            res.json(data.entry_data.TagPage[0].tag.media.nodes);
        }
    });
     
    // Queue just one URL, with default callback 
    c.queue('https://www.instagram.com/explore/tags/'+hashtag+'/');
});

var PORT = process.env.PORT || 3000;
// LISTEN SERVER PORT
app.listen(PORT);

 

 
