#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var argv = require('yargs');
var readline = require('readline');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

argv = argv
    .usage('Import all your ghost.org exported posts into minimalistic-blog mongodb schema')
    .example('$0 posts-folder mongodb://username:password@localhost:27017/blog', 'Imports posts from the specified folder to the specified mongodb instance.')
    .options('a', {
        describe: 'JSON object with default author details',
        alias: 'author',
        default: '{}'
    })
    .demand(2)
    .argv;

var postsFolder = path.resolve(argv._[0]);
var mongoConnectionString = argv._[1];
var authorJSONString = argv.author;
const postFiles = fs.readdirSync(postsFolder).filter(function (file) {
    return file.endsWith(".md");
});

if(postFiles.length == 0) {
    console.log("The posts folder is empty!");
    return;
}

function readPostFile(postFilePath) {
    return function(done) {
        var postData = { content: "" };
        var headerCounter = 0;

        var lineReader = readline.createInterface({
            input: fs.createReadStream(postFilePath)
        });

        lineReader.on('line', function(line){
            if(line === "---") {
                headerCounter++;
            } else if(headerCounter == 1) {
                const headerComponents = line.split(/:(.+)?/);
                postData[headerComponents[0]] = headerComponents[1].trim();
            } else if(headerCounter == 2) {
                postData.content += (line + "\n");
            }
        });

        lineReader.on('close', function(){
            done(null, postData);
        });
    }
}

// got from https://strongloop.com/strongblog/how-to-generators-node-js-yield-use-cases/
function run (genFn) {
    var gen = genFn();
    next();

    function next(er, value) {
        if (er) return gen.throw(er);
        var continuable = gen.next(value);

        if (continuable.done) return;
        var cbFn = continuable.value;
        cbFn(next);
    }
}
var postsData = {};
mongoose.connect(mongoConnectionString);

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var BlogPostSchema = new Schema({
    author: ObjectId,
    title: String,
    slug: String,
    link: String,
    content: String,
    image: String,
    date_published: Date,
    date_updated: Date,
    draft: Boolean,
    tags: String
});

var AuthorSchema = new Schema({
    username: String,
    password: String,
    first_name: String,
    last_name: String,
    email: String,
    twitter: String,
    linkedin: String
});

var Author = mongoose.model('Author', AuthorSchema);
var BlogPost = mongoose.model('BlogPost', BlogPostSchema);

var author = new Author(JSON.parse(authorJSONString));
author.password = bcrypt.hashSync(author.password, 8);

author.save(function(err) {
    if(err) {
        console.log("Error saving author " + author.first_name + " " + author.last_name + ": " + err);
    } else {
        console.log("Author " + author.first_name + " " + author.last_name + " was saved!");
    }
});

run(function* () {
    try {
        let postCounter = 0;

        for (var i = 0; i < postFiles.length; i++) {
            const postFilename = postFiles[i];
            const postFilePath = path.resolve(postsFolder, postFilename);

            let postData = yield readPostFile(postFilePath);
            if(postData.title) {
                let blogPost = new BlogPost({
                    author: author._id,
                    title: postData.title,
                    slug: postData.slug,
                    link: null,
                    content: postData.content,
                    tags: postData.tags ? postData.tags : null,
                    image: postData.image ? postData.image : null,
                    date_published: postData.date_published ? postData.date_published : null,
                    date_updated: postData.date_updated ? postData.date_updated : null,
                    draft: postData.draft == true
                });

                blogPost.save(function(err) {
                    if(err) {
                        console.log("Error saving blogPost " + blogPost.title + ": " + err);
                    } else {
                        console.log("BlogPost " + blogPost.title + " was saved!");
                    }

                    postCounter++;
                    if(postCounter == postFiles.length) {
                        mongoose.disconnect();
                    }
                });
            }
        }
    } catch (er) {
        console.error(er)
    }

});