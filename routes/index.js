var createError = require('http-errors');
var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');

const {Client} = require('pg');
const client = new Client({user: 'postgres', password: 'docker', host: '192.168.99.100', database: 'postgres'});
client.connect();

async function hashPassword (unhashed) {

  const password = unhashed
  const saltRounds = 10;

  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })

  return hashedPassword
}
const authenticateMiddleware = async function(req,res,next) {
  // look up session cookie
  if (req.cookies['authCookie']){ 
    
    //does session cookie exist?
    var info = await client.query(`SELECT * from sessions where token='${req.cookies['authCookie']}';`);
    

    // if (exists) {req.user=dbResponse.rows[0].username; next()}
    if(info.rows[0].length!=0){
      username = await client.query(`SELECT username from users where userid='${info.rows[0].userid}';`);
      req.username = username.rows[0].username;
      next();
      return;
    }
  } 
  
  
}

// Get Profile page 
router.get('/profile',authenticateMiddleware, function(req, res, next) {
  res.render('profile',{user:req.username});
});

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Hello world');
  res.render('index', { title: req.query.name });
});

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.get('/test', async function(req, res, next) {
  var dbresponse = await client.query('SELECT NOW()');
  res.send(dbresponse.rows[0]);
});

// GET login page
router.get('/login', function(req, res, next) {
  res.render('login');
});

// LOGIN function
router.post('/login', async function(req, res, next) {
  console.log('SELECT username, password FROM users WHERE username='+"'"+req.body.username+"'"+";");
  var is_user = await client.query(`SELECT userid,username, password FROM users WHERE username='${req.body.username}';`);
  if (is_user.rows.length!=0){ // if the username exists we move on to comparing hashes
    var passhash = is_user.rows[0].password;

    console.log('SELECT username, password FROM users WHERE username='+"'"+req.body.username+"'"+' AND password='+"'"+req.body.password+"'"+";");
    console.log(is_user);  
    if(is_user.rows && bcrypt.compareSync(req.body.password,passhash)){ // if the username and password combo returns a valid row, and that row is correct
      var tokenstring = "xyz"+String(Math.random());
      await client.query(`INSERT INTO sessions (userid, token) VALUES ('${is_user.rows[0].userid}','${tokenstring}')`); //sets token on login
      res.cookie('authCookie',tokenstring);
      res.render('profile',{user: req.body.username});
    }
    else{ 
      next(createError(401));
    }
  
  }
  
  else{
    console.log(is_user);
    next(createError(401,`Error looking up user '${is_user.rows}'`));
  }
  
});

// SQL injection, we see we can register without a password/username so ',''); SELECT pg_sleep(5);--
router.post('/register', async function(req, res, next) {
  if(req.body.username && req.body.password){
    console.log("INSERT INTO users ( username, password ) VALUES ("+"'"+req.body.username+"'"+","+"'"+req.body.password+"'"+");");
    try {
      var final_hash = await hashPassword(req.body.password);
      console.log(final_hash);
      var db_response = await client.query(`INSERT INTO users ( username, password ) VALUES ('${req.body.username}','${final_hash}');`);
      res.redirect('/login');
    } 
    
    catch (error) {
      console.log(error);
    }
    
  }
  else{
    next(createError(401));

  }
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});

// Allows for reflected database stuff 

router.post('/forgot', async function(req, res, next) {
  console.log(`SELECT * from users where username='${req.body.username}';`);
  var db_response = await client.query(`SELECT * from users where username='${req.body.username}';`);
  console.log(db_response);
  var username_return = '';
  db_response.rows.forEach(element => username_return+=element.username);
  res.render('forgot_valid',{user:username_return});
});



module.exports = router;
