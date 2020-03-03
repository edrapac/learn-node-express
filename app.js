var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const exphbs = require('express-handlebars');
const handlebars = require('./util/handlebars')(exphbs);

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '192.168.99.100',
  database: 'postgres',
  password: 'docker'
})
client.connect().then(()=>{
  client.query(`CREATE TABLE IF NOT EXISTS users (userid SERIAL PRIMARY KEY,username varchar(45) UNIQUE, password varchar(100));
                CREATE TABLE IF NOT EXISTS sessions (userid INTEGER REFERENCES users(userid), token varchar(100));`, (err, res) => {
    if (err) {
      console.log("Error initializing database: ", err);
    } else {
      console.log("Database ready");
    }
  })
})

var authenticatedMiddleware = async function(req,res,next) {
  // look up session cookie
  if (req.cookies['authCookie']){ 
    
    //does session cookie exist?
    var info = await client.query(`SELECT * from sessions where token='${req.cookies['authCookie']}';`);
    

    // if (exists) {req.user=dbResponse.rows[0].username; next()}
    if(info.rows[0].length!=0){
      username = await client.query(`SELECT username from users where userid='${info.rows[0].userid}';`);
      req.username = username.rows[0].username; // set the username param to that of the looked up value for subsequent requests
      next();
      return;
    }
  } 
  
  
}

app.use(authenticatedMiddleware)


app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
