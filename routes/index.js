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
    if(info.rows.length!=0){
      username = await client.query(`SELECT username, usernickname from users where userid='${info.rows[0].userid}';`);
      req.username = username.rows[0].username;
      req.id = info.rows[0].userid;
      req.usernickname = username.rows[0].usernickname;
      next();
      return;
    }
    if (info.rows.length==0){
      res.redirect('/login');
    }
  
  } 
  else{
    res.redirect('/login')
  }
    
} 

// Get Profile page 
router.get('/profile',authenticateMiddleware, async function(req, res, next) {
  let comments = await client.query(`SELECT comment FROM comments where userid='${req.id}';`)
  console.log(comments.rows)
  res.render('profile',{user:req.username,commentlist:comments.rows,nickname:req.usernickname});
}); 

router.get('/profile/:username',authenticateMiddleware, async function(req, res, next) {
  if(req.params.username){
    let username = await client.query(`SELECT username from users where username='${req.params.username}';`)
  }
  else{
    res.redirect('/profile');
  }
  
  if(username.rows.length>0){ // if the user exists
    let comments = await client.query
      (
      `SELECT c.comment,c.private,c.userid,u.username FROM comments AS c INNER JOIN users AS u ON c.userid=u.userid WHERE u.username='${req.params.username}';`
      );
    let commentarr = comments.rows;
    
    var publicComments = commentarr.filter(function (item){
      return (String(item.private) !== 'true'); // hides private comments
    });
    console.log(publicComments);
    
    res.render('otheruser',{user:username.rows[0].username,commentlist:publicComments});
  }
  
  else{
    next(createError(404)); // if the user doesnt exist
  }
  
}); 

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Hello world');
  res.render('index', { title: req.query.name });
});

router.get('/register', function(req, res, next) {
  res.render('register');
});

// GET login page
router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});

// LOGIN function
router.post('/login', async function(req, res, next) {
  console.log(`SELECT username, password FROM users WHERE username='${req.body.username}';`);
  var is_user = await client.query(`SELECT userid,username, password FROM users WHERE username='${req.body.username}';`);
  if (is_user.rows && is_user.rows.length!=0){ // if the username exists we move on to comparing hashes
    var passhash = is_user.rows[0].password;

    console.log(`SELECT username, password FROM users WHERE username='${req.body.username}' AND password='${req.body.password}';`);
    console.log(is_user);  
    if(is_user.rows && bcrypt.compareSync(req.body.password,passhash)){ // if the username and password combo returns a valid row, and that row is correct
      var tokenstring = "xyz"+String(Math.floor(Math.random()*100000));
      await client.query(`INSERT INTO sessions (userid, token) VALUES ('${is_user.rows[0].userid}','${tokenstring}');`); //sets token on login
      res.cookie('authCookie',tokenstring);
      res.redirect('profile');
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

router.post('/register', async function(req, res, next) {
  if(req.body.username && req.body.password){
    console.log(`INSERT INTO users ( username, password ) VALUES ('${req.body.username}','${req.body.password}');`);
    try {
      var final_hash = await hashPassword(req.body.password);
      console.log(final_hash);
      var db_response = await client.query(`INSERT INTO users ( username, password,usernickname ) VALUES ('${req.body.username}','${final_hash}','${req.body.usernickname}');`);
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

// Allows for error based/classic SQL injection 
router.post('/forgot', async function(req, res, next) {
  console.log(`SELECT * from users where username='${req.body.username}';`);
  var db_response = await client.query(`SELECT * from users where username='${req.body.username}';`);
  console.log(db_response);
  var username_return = '';
  db_response.rows.forEach(element => username_return+=element.username);
  res.render('forgot_valid',{user:username_return});
});

router.post('/newcomment',authenticateMiddleware, async function(req, res, next){
  
  if(req.body.privatepost)
  { // if post is private
    var newcomment = await client.query(`INSERT INTO comments (userid,comment,private) VALUES ('${req.id}','${req.body.newcomment}','true');`);
  }

  else
  { // if post is public
    var newcomment = await client.query(`INSERT INTO comments (userid,comment,private) VALUES ('${req.id}','${req.body.newcomment}','false');`);
  }
  res.redirect('/profile')
});


module.exports = router;
