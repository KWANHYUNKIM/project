/**
 *  This file only manages servers 
 * 
 */
 const express = require('express');
 const app = express();
 // Split the router,
 const user = require('./routers/get_page'); 
 const merge = require('./routers/merge');
 // To open the server,
 const hostname = '127.0.0.1';
 const port = 3000;
 const path = require('path');
 // It is to set the environment to use the pug file and pjs file.
 app.set('view engine', 'ejs');
 app.set('views', path.join(__dirname, 'views'));
 
 app.engine('pug',require('pug').__express);
 app.engine('ejs',require('ejs').__express);
 
 /* GET home page. */
 app.get('/', (req, res) => {
     const str = '<!DOCTYPE html>' + '<html><head><title>Assignment 2</title></head>' + '<body>' +
     '<h1>' + 'Assignment 2' + '</h1>' +
     '<li>User can search weather and location together! </li>' +
     '<li>User link : <a href="http://localhost:3000/searching-function">http://localhost:3000/searching-function</a></li>' +
     '</ul>' + '</body></html>';
     res.writeHead(200,{'content-type': 'text/html'}); res.write(str);
     res.end();
     });
 
 // view engine setup
 app.use('/searching-function',user);
 app.use('/merge',merge);
 // Express app listening 
 app.listen(port, function () {
     console.log(`Express app listening at http://${hostname}:${port}`); 
 });
   
 module.exports = app;