var Crawler = require("crawler");
var url = require('url');
var express = require('express');
var cors = require('cors');
var moment = require('moment');

var app = express();

app.use(cors());

app.get('/', function (req, res) {
    var hashtag = req.query.hash;

    getImagesHash(hashtag, res);

});

function getImagesHash(hashtag, res) {
    var c = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, result, $) {
            var item = $("script[type=\"text/javascript\"]").filter(function() {
              return $(this).text().indexOf('window._sharedData') > -1;
            }).text();
            item = item.replace(/(window._sharedData = )/g,"");
            item = item.replace(/(;)/g,"");

            var data = JSON.parse(item);
            var nodes = data.entry_data.TagPage[0].tag.media.nodes;
            var urls = [];

            //res.json(nodes);
            nodes.map(function(item){
                urls.push('https://www.instagram.com/p/'+ item.code);
            });

            getUsers(urls, nodes, res);
        }
    });

    // Queue just one URL, with default callback
    c.queue('https://www.instagram.com/explore/tags/'+hashtag+'/');
}

function getUsers(urls, nodes, res) {

    var pages = [];

    var c = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, result, $) {
            var item = $("script[type=\"text/javascript\"]").filter(function() {
              return $(this).text().indexOf('window._sharedData') > -1;
            }).text();
            item = item.replace(/(window._sharedData = )/g,"");
            item = item.replace(/(;)/g,"");

            var data = JSON.parse(item);

            pages.push(data);
        },
        onDrain : function() {
            var resp = [];

            for (var i = 0; i < nodes.length; i++) {

                for (var j = 0; j < pages.length; j++) {
                    var datePost = moment.unix(pages[j].entry_data.PostPage[0].graphql.shortcode_media.taken_at_timestamp);
                    var dateInit = moment('2017-02-01');
                    if (datePost.isAfter(dateInit)) {
                        if (nodes[i].id == pages[j].entry_data.PostPage[0].graphql.shortcode_media.id) {
                            resp.push({
                                img: nodes[i].display_src,
                                caption: nodes[i].caption,
                                user: pages[j].entry_data.PostPage[0].graphql.shortcode_media.owner.username,
                                fullname: pages[j].entry_data.PostPage[0].graphql.shortcode_media.owner.full_name
                            });
                        }
                    }
                }

            }

            res.json(resp);
        }
    });

    // Queue just one URL, with default callback
    c.queue(urls);
}

var PORT = process.env.PORT || 3000;
// LISTEN SERVER PORT
app.listen(PORT);
