var express = require('express'); 
var router = express.Router();

// excute to get_page that is searching function 
router.get('/', function(req, res, next) {
    res.render('get_page', { title: 'searching-function' });  
});
module.exports = router;
