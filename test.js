router.post('/loginpage', async function (req, res, next) {
  var username = req.body.logusername;
  var password = req.body.logpassword;
  //if (username && password) {
  var dbresponse = await client.query(`SELECT * FROM users WHERE username='${req.body.logusername}' and password='${req.body.logpassword}'`);
  if (dbresponse.rows.length == 0) {
    //	request.session.loggedin = true;
    //	request.session.username = username;
    //res.get('/profile');
    console.log("Worked")
    res.redirect('/profile');
  } else {
    res.send('Incorrect Username and/or Password!');
  }
  res.end();
  /*} else {
      resp.send('Please enter Username and Password!');
      res.end();
  }*/
});