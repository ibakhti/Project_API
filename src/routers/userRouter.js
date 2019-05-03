const router = require('express').Router();
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');

const conn = require('./../connection/connection');

//--------REGISTER USER--------------//
// save data user to database
// firstname, lastname not ''
router.post('/users', async (req, res) => {
    const sql = 'INSERT INTO users SET ?';
    const data = req.body;
    data.firstName = data.firstName === '' ? null : data.firstName;
    data.lastName = data.lastName === '' ? null : data.lastName;

    if (!isEmail(data.email)) return res.status(400).send("Not support Email Format"); 
    data.password = await bcrypt.hash(data.password, 8);

    conn.query(sql, data, (err, result) => {
        err ? res.send(err.sqlMessage) : res.send(result)
    });
});

//---------REGISTER ADDRESS USER-----------//
//save user address to database
router.post('/users/address', (req, res) => {
    const sql = 'INSERT INTO address SET ?';
    const data = req.params; 

    conn.query(sql, data, (err, result) => {
        err ? res.send(err.sqlMessage) : res.send(result)
    });
});

//---------USER LOGIN----------------------//
router.get('/users/login', (req, res) => {
    const {email, password} = req.query;
    const sql = `SELECT * FROM users WHERE email = '${email}'`;

    conn.query(sql, (err, result) => {
        if (err)  return res.send(err.sqlMessage); 
        if (!result.length)  return res.send("Email and Password Is Not exist");

        const isMatch = bcrypt.compareSync(password, result[0].password);
        !isMatch ? res.send("Email and Password Is Not exist") : res.send(result);
    })
});

//-----------GET USER--------------------//
router.get('/users', (req, res) => {
    const {id} = req.query;
    const sql = `SELECT * FROM users WHERE userId = ${id}`
    
    conn.query(sql, (err, result) => {
        err ? res.status(400).send(err.sqlMessage) : res.send(result)
    })
});

//------------UPDATE USER---------------//
router.put('/users/update/:userId', (req, res) => {
    const data = [req.body, req.params.userId];
    const sql = `UPDATE users SET ? WHERE userId = ?`;
    
    conn.query(sql, data, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage)
        res.send(result)
    })
});

//-----------CHANGED PASSWORD-----------//
router.put('/users/pass/:userId', async (req, res) => {
    const data = req.body;
    const sql = `UPDATE users SET ? WHERE userId = ${req.params.userId}`;

    data.password = await bcrypt.hash(data.password, 8);

    conn.query(sql, data, (err, result) => {
        if (err) return res.status(400).send(err.sqlMessage)

        res.send(result);
    })
})






module.exports = router