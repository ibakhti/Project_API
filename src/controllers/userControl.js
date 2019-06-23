const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');

const conn = require('./../connection/connection');
const path = require("path");
const fs = require("fs");
const uploadDir = path.join(__dirname + "/../../avatar/");




module.exports = {
    userRegister: async (req, res) => {
        const sql = 'INSERT INTO users SET ?';
        const data = req.body;
        data.userName = data.userName === '' ? null : data.userName;
        data.firstName = data.firstName === '' ? null : data.firstName;
        data.lastName = data.lastName === '' ? null : data.lastName;
    
        if (!isEmail(data.email)) return res.send("Not support Email Format"); 
        data.password = await bcrypt.hash(data.password, 8);
    
        conn.query(sql, data, (err, result) => {
            err ? res.send(err.sqlMessage) : res.status(200).send(result)
        });
    },
    userLogin: (req, res) => {
        const {email, password} = req.query;
        const sql = `SELECT * FROM users WHERE email = '${email}'`;
    
        conn.query(sql, (err, result) => {
            if (err)  return res.send(err.sqlMessage); 
            if (!result.length)  return res.send("Email and Password Is Not exist");
    
            const isMatch = bcrypt.compareSync(password, result[0].password);
            !isMatch ? res.send("Email and Password Is Not exist") : res.send(result);
        })
    },
    userGet: (req, res) => {
        const {id} = req.query;
        const sql = `SELECT * FROM users WHERE userId = ${id}`
        
        conn.query(sql, (err, result) => {
            err ? res.send(err.sqlMessage) : res.send(result)
        })
    },
    userUpdate: (req, res) => {
        const data = [req.body, req.params.userId];
        const sql = `UPDATE users SET ? WHERE userId = ?`;
        
        conn.query(sql, data, (err, result) => {
            if(err) return res.send(err.sqlMessage)
            res.send(result)
        })
    },
    userPassChaged: async (req, res) => {
        const data = req.body;
        const sql = `UPDATE users SET ? WHERE userId = ${req.params.userId}`;
    
        data.password = await bcrypt.hash(data.password, 8);
    
        conn.query(sql, data, (err, result) => {
            if (err) return res.status(400).send(err.sqlMessage)
    
            res.send(result);
        })
    },
    addressRegister: (req, res) => {
        const sql = 'INSERT INTO address SET ?';
        const data = req.body;
    
        conn.query(sql, data, (err, result) => {
            err ? res.send(err.sqlMessage) : res.send(result)
        });
    },
    addressGet: (req, res) => {
        const sql = `SELECT address, city, state, zip, phoneNumber FROM address WHERE userId = ${req.query.userId}`;
        
        conn.query(sql, (err, result) => {
            if(err) return res.status(400).send(err.sqlMessage)
            
            res.send(result)
        })
    },
    addressUpdate: (req, res) => {
        const data = [req.body, req.params.userId];
        const sql = `UPDATE address SET ? WHERE userId = ?`;
        
        conn.query(sql, data, (err, result) => {
            if(err) return res.status(400).send(err.sqlMessage)
            res.send(result)
        })
    },
    uploadAvatar: (req, res) => {
        const sql = `UPDATE users SET avatar = '${req.file.filename}' WHERE userId = ${req.body.userId}`;
        if(req.body.oldImg !== "null") {
            fs.unlinkSync(uploadDir + "/" + req.body.oldImg)
        }
        
        conn.query(sql, (err, result) => {
            if(err) return res.status(400).send(err.sqlMessage);

            res.status(200).send({result, img:req.file.filename})
        })
    },
    getAvatar: (req, res) => {
        res.sendFile(uploadDir + "/" + req.params.img)
    }
}