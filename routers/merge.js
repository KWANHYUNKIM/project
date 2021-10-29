require('dotenv').config();
const AWS = require("aws-sdk");
const ejs = require('ejs')
const redis = require('redis');
const { response } = require('express');
const { title } = require('process');
const { dir, Console } = require('console');

var express = require('express');
var router = express.Router();
const axios = require('axios');

const bucketName = 'test105-a2-store';

//Create a promise on S3 service object
const bucketPromise = new AWS.S3({ apiVersion: '2006-03-01' }).createBucket({ Bucket: bucketName }).promise();
bucketPromise.then(function (data) {
    console.log("Successfully created " + bucketName);
})
    .catch(function (err) {
        console.error(err, err.stack);
    });

// router for searching clicked location photo
router.get('/', function (req, res, next) {
    const query = req.query.uservalue;
    const twitterRequest = axios.get(`https://api.twitter.com/2/tweets/search/recent?query=${query}`,
        {
            headers: {
                'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAJDyUwEAAAAATIzY%2BqFHF79dTdzc%2BkvQvtXVnuM%3DfQBgsZPOvHSUSa6eC2o5ouxeZnWyWhmRB4DixIlUyVIN4KptPk'
            }
        });
    const weatherRequest = axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=40280448ac5cd05b973956bf4a7fc3a6&units=metric`);
    const YoutubeRequest = axios.get(`https://www.googleapis.com/youtube/v3/search?key=AIzaSyAdyX8Jls13ZaxqmeuLbAhJ0bM3XfMz1tM&part=snippet&q=${query}&maxResults=5`);

    axios.all([twitterRequest, weatherRequest, YoutubeRequest]) //weatherRequest
        .then(
            axios.spread((...responses) => {
                const responseOne = "Recommendation ID in twitter:" + responses[0].data.meta.newest_id;
                const responseTwo = "The temperature of country:" + responses[1].data.main.temp;
                const responseThree = "Recommendation ID in Youtube:" + responses[2].data.items[0].id.videoId;
                // use/access the results
                console.log(responseOne, responseTwo, responseThree); //rsponseTwo
                const body = JSON.stringify({ source: 'S3 Bucket', ...responseOne + responseTwo + responseThree });
                const objectParams = { Bucket: bucketName, Key: query, Body: body };
                const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
                uploadPromise.then(function (data) {
                    console.log("Successfully uploaded data to " + bucketName + "/" + query);
                }
                );

                res.render('../views/result.pug', { ///Users/kwanhyunkim/Desktop/assignment/views/result.pug
                    twitter: responseOne,
                    weather: responseTwo,
                    youtube: responseThree
                })
            }));

})
// Used for header info later.
const redisClient = redis.createClient();

router.get('/api/search', (req, res) => {

    // Construct the wiki URL and key
    // A search bar should be placed here
    const query = req.query.uservalue;
    console.log(query);
    const redisKey = query;
    const s3Key = query;
    const twitterRequest = axios.get(`https://api.twitter.com/2/tweets/search/recent?query=${query}`,
        {
            headers: {
                'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAJDyUwEAAAAATIzY%2BqFHF79dTdzc%2BkvQvtXVnuM%3DfQBgsZPOvHSUSa6eC2o5ouxeZnWyWhmRB4DixIlUyVIN4KptPk'
            }
        });
    const weatherRequest = axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=40280448ac5cd05b973956bf4a7fc3a6&units=metric`);
    const YoutubeRequest = axios.get(`https://www.googleapis.com/youtube/v3/search?key=AIzaSyAdyX8Jls13ZaxqmeuLbAhJ0bM3XfMz1tM&part=snippet&q=${query}&maxResults=5`);
    const params = { Bucket: bucketName, Key: s3Key };

    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
        region: 'ap-southeast-2',
        params: {
            Bucket: process.env.BUCKET_NAME
        }
    });
    s3.headObject(params, (err, data) => {
        if (data == null) {
            axios.all([twitterRequest, weatherRequest, YoutubeRequest]) //weatherRequest
                .then(
                    axios.spread((...responses) => {
                        const responseOne = responses[0].data.meta.newest_id;
                        const responseTwo = responses[1].data.main.temp;
                        const responseThree = responses[2].data.items[0].id.videoId;
                        const body = JSON.stringify({ source: 'S3 Bucket', ...responseOne + responseTwo + responseThree });
                        const objectParams = { Bucket: bucketName, Key: query, Body: body };
                        const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
                        uploadPromise.then(function (data) {
                            console.log("Successfully uploaded data to " + bucketName + "/" + query);
                        }
                        );
                    }))
        }

        else if (data.AcceptRanges == 'bytes') {
            // Serve from Wikipedia API and store in cache return axios.get(searchUrl)
            const responseJSON = response.data;
            redisClient.setex(redisKey, 3600, JSON.stringify({ source: 'API', ...responseJSON, }));
            return res.status(200).json({ source: 'Redis Cache', ...responseJSON, });
        }
    });
});



module.exports = router;