const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path')

const conn = require('./../connection/connection');

const uploadDir = path.join(__dirname + '/../../pictures/');

//----------ADD PRODUCTS----------//
router.post('/products', (req, res) => {
    const data = req.body;
    const sql = `INSERT INTO products SET ?`;

    conn.query(sql, data, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.send(result);
    })
});

//----------ADD PICTURES PRODUCTS---------//
const Storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + file.originalname)
    }
})

const upload = multer({
    storage:Storage,
    limits: {
        fileSize: 8000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            //tolak
            return cb(new Error('please upload image file (jpg, jpeg, png)'))
        }
        
        cb(undefined, true)
    }
})

router.post('/picture/upload/:sku', upload.single('img'), async (req,res) => {
    const data = {
        sku: req.params.sku,
        img: req.file.filename
    }
    const sql = `INSERT INTO productPicts SET ?`

    conn.query(sql, data, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send("success")
    })    
});

//-------GET PRODUCT PICT--------//
router.get('/picture/:img', (req, res) => {
    res.sendFile(uploadDir + '/' + req.params.img)
})

//-------GET PRODUCT PICT BY CATEGORY--------//
router.get('/product/picture', (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE category = '${req.query.category}' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) =>{
        if(err) return res.status(400).send(err.sqlMessage)

        res.status(200).send(result)
    })
})

//------GET PRODUCT DETAIL BY SKU-------//
router.get('/product/detail', (req, res) => {
    const sql = `SELECT img FROM productPictView WHERE sku = '${req.query.sku}'`
    const sql2 = `SELECT * FROM productSizeStockView WHERE sku = '${req.query.sku}'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage)

        conn.query(sql2, (err, result2) => {
            if(err) return res.status(400).send('from err2' + err.sqlMessage)

            res.send([result, result2])
        })
    })
})

//------ADD TO CART----------//
router.put('/cart/add', (req, res) => {
    const data = req.body
    const sql = `SELECT quantity FROM cart WHERE userId=${data.userId} AND sku =${data.sku}`
    const sql2 = 'INSERT INTO cart SET ?'

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send("err: " + err.sqlMessage)

        if(result.length == 0){
            conn.query(sql2, data, (req, result2) => {
                if(err) return res.status(400).send("err2: " +err.sqlMessage);

                res.status(200).send(result2)
            })
        }else {
            conn.query(`UPDATE cart SET quantity=${result[0].quantity + 1} WHERE userId=${data.userId} AND sku =${data.sku}`, (err, result3) => {
                if(err) return res.status(400).send("err3 " + err.sqlMessage)

                res.status(200).send(result3)
            })
        } 
    })
});

//-----------------GET CART-----------------//
router.get('/cart', (req, res) => {
    const data = req.query.userId
    const sql = `SELECT * FROM cartView WHERE userId=?`

    conn.query(sql, data, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage)

        res.status(200).send(result)
    })
})

//-----------------REMOVE CART-----------------//
router.delete('/cart/remove', (req, res) => {
    const sql = `DELETE FROM cart WHERE userId = ${req.body.userId} AND sku = ${req.body.sku}`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).status(err.sqlMessage)

        res.status(200).send(result)
    })
})

module.exports = router;