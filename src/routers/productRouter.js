const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const conn = require("./../connection/connection");

const uploadDir = path.join(__dirname + "/../../pictures/");

//----------ADD PRODUCTS----------//
router.post("/products", (req, res) => {
  const data = req.body;
  const sql = `INSERT INTO products SET ?`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(200).send(err.sqlMessage);

    res.send(result);
  });
});

// ----------ADD PRODUCTS SIZE AND STOCK------//
router.post("/products/size", (req, res) => {
  const data = {
    sku: req.body.sku,
    unitSize: req.body.unitSize,
    unitStock: req.body.unitStock,
    stockDisplay: req.body.unitStock
  };
  const sql = `SELECT productId FROM productSizeAndStock WHERE sku = ${req.body.sku} AND unitSize = ${req.body.unitSize}`
  const sql2 = `INSERT INTO productSizeAndStock set ?`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage)

    if(result.length !== 0){
      res.send({exist: 1})
    }else{
      conn.query(sql2, data, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);
    
        res.status(200).send(result);
      })
    }
  })
})

//----------ADD PICTURES PRODUCTS---------//
const Storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 8000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      //tolak
      return cb(new Error("please upload image file (jpg, jpeg, png)"));
    }

    cb(undefined, true);
  }
});

router.post("/picture/upload/:sku", upload.single("img"), async (req, res) => {
  const data = {
    sku: req.params.sku,
    img: req.file.filename
  };
  const sql = `INSERT INTO productPicts SET ?`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send({result, url: `http://localhost:8080/picture/${req.file.filename}`});
  });
});

// ----UPDATE PRODUCT PICT----//
router.put("/picture/update/:oldName", upload.single("img"), async (req, res) => {
  const sql = `UPDATE productPicts SET img='${req.file.filename}' WHERE imgId=${req.body.imgId}`
  // console.log([req.file.filename, req.params.oldName, req.body.imgId])
  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage)
    
    fs.unlinkSync(uploadDir + req.params.oldName);
    res.send({result, url:`http://localhost:8080/picture/${req.file.filename}`});
  });
  
});

//-------GET PRODUCT PICT--------//
router.get("/picture/:img", (req, res) => {
  res.sendFile(uploadDir + "/" + req.params.img);
});

// --------GET NEWEST PRODUCT-----//
router.get("/product/new", (req, res) => {
  const sql = `SELECT	* FROM productPictView WHERE	img NOT LIKE '%a%' ORDER BY timeAdded desc LIMIT 3`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result)
  });
});



//-------GET PRODUCT PICT BY CATEGORY--------//
router.get("/product/picture", (req, res) => {
  const sql = `SELECT * FROM productPictView WHERE category = '${
    req.query.category
  }' AND img NOT LIKE '%a%'`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

//------GET PRODUCT DETAIL BY SKU-------//
router.get("/product/detail", (req, res) => {
  const sql = `SELECT img FROM productPictView WHERE sku = '${req.query.sku}'`;
  const sql2 = `SELECT * FROM productSizeStockView WHERE sku = '${
    req.query.sku
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    conn.query(sql2, (err, result2) => {
      if (err) return res.status(400).send("from err2" + err.sqlMessage);

      res.send([result, result2]);
    });
  });
});

//------ADD TO CART----------//
router.put("/cart/add", (req, res) => {
  const data = req.body;
  const sql = `SELECT quantity FROM cart WHERE userId=${
    data.userId
  } AND productId = ${data.productId}`;
  const sql2 = "INSERT INTO cart SET ?";

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send("err: " + err.sqlMessage);

    if (result.length == 0) {
      conn.query(sql2, data, (err, result2) => {
        if (err) return res.status(400).send("err2: " + err.sqlMessage);

        res.status(200).send(result2);
      });
    } else {
      const sql3 = `UPDATE cart SET quantity=${result[0].quantity +
        1} WHERE userId = ${data.userId} AND productId = ${data.productId}`;
      conn.query(sql3, (err, result3) => {
        if (err) return res.status(400).send("err3 " + err.sqlMessage);

        res.status(200).send(result3);
      });
    }
  });
});

//-----------------UPDATE STOCK DISPLAY AFTER ADD TO CART-------------//
router.put("/product/stock/update/minus", (req, res) => {
  const sql = `SELECT stockDisplay FROM productSizeAndStock WHERE productId=${
    req.body.productId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);
    const sql2 = `UPDATE productSizeAndStock SET stockDisplay = ${result[0]
      .stockDisplay - 1} WHERE productId=${req.body.productId}`;
    conn.query(sql2, (err, result2) => {
      if (err) return res.status(400).send("err2: " + err.sqlMessage);

      res.status(200).send(result2);
    });
  });
});
//-----------UPDATE DATA WHEN REMOVE CART-------------//
router.put("/product/stock/update/plus", (req, res) => {
  const sql = `SELECT stockDisplay FROM productSizeAndStock WHERE productId=${
    req.body.productId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    const sql2 = `UPDATE productSizeAndStock SET stockDisplay = ${result[0]
      .stockDisplay + 1} WHERE productId=${req.body.productId}`;
    conn.query(sql2, (err, result2) => {
      if (err) return res.status(400).send("err2: " + err.sqlMessage);

      res.status(200).send(result2);
    });
  });
});

//-----------------GET CART-----------------//
router.get("/cart", (req, res) => {
  const data = req.query.userId;
  const sql = `SELECT * FROM cartView WHERE userId=?`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

//-----------------REMOVE CART-----------------//
router.delete("/cart/remove", (req, res) => {
  const sql1 = `SELECT quantity FROM cart WHERE userId = ${
    req.body.userId
  } AND productId=${req.body.productId}`;
  const sql2 = `DELETE FROM cart WHERE userId = ${
    req.body.userId
  } AND productId=${req.body.productId}`;

  conn.query(sql1, (err, result1) => {
    if (err) return res.status(400).send("err1 " + err.sqlMessage);

    if (result1[0].quantity === 1) {
      conn.query(sql2, (err, result2) => {
        if (err) return res.status(400).send("err2 " + err.sqlMessage);

        res.send(result2);
      });
    } else {
      const sql3 = `UPDATE cart SET quantity = ${result1[0].quantity -
        1} WHERE userId = ${req.body.userId} AND productId = ${
        req.body.productId
      }`;
      conn.query(sql3, (err, result3) => {
        if (err) return res.status(400).send("err3 " + err.sqlMessage);

        res.send(result3);
      });
    }
  });
});

//---------DELETE ALL CART AFTER CHECKOUT----------//
router.delete("/allcart", (req, res) => {
  const sql = `DELETE FROM cart WHERE userId = ${req.body.userId}`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/search/productName", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE productName LIKE '%${req.query.name}%' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/color", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE color LIKE '%${req.query.color}%' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/category", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE category LIKE '${req.query.category}' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/price", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE unitPrice >= ${req.query.min} AND unitPrice <= ${req.query.max} AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/size", (req, res) => {
    const sql = `SELECT * FROM productSizeStockImgView WHERE unitSize = ${req.query.size}`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

// --------ALL PRODUCT FOR MANAGE PRODUCT---//
router.get("/allproduct", (req, res) => {
  const sql = `SELECT * FROM productView`

  conn.query(sql, (err, result) => {
    if(err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result)
  })
})


// -----------PRODUCT FOR EDIT----------//
router.get("/edit", (req, res) => {
  const sql = `SELECT * FROM productView WHERE productId = ${req.query.productId}`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result)
  })
})

//---------GET PRODUCT PICT----------//
router.get("/edit/pict", (req, res) => {
  const sql = `SELECT imgId, img FROM productPicts WHERE sku = ${req.query.sku}`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send([{imgId: result[0].imgId, url1:`http://localhost:8080/picture/${result[0].img}`}, { imgId: result[1].imgId, url2:`http://localhost:8080/picture/${result[1].img}`}, {imgId: result[2].imgId, url3:`http://localhost:8080/picture/${result[2].img}` }])
  })
})

// -----UPDATE PRODUCT--------------//
router.put("/product/update", (req, res) => {
  const data = req.body;
  const sql = `UPDATE products SET ? WHERE sku = ${req.query.sku}`;

  conn.query(sql, data, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result);
  });
});


// ----------UPDATE PRODUCT SIZE---------//
router.put("/product/update/size", (req, res) => {
  const data = req.body;
  const sql = `UPDATE productSizeAndStock SET ? WHERE productId=${req.query.productId}`

  conn.query(sql, data, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// ---------DELETE PRODUCT AND SIZE------//
router.delete("/product/delete", (req, res) => {
  const sql = `SELECT COUNT(*) num FROM productSizeAndStock WHERE sku=${req.body.sku}`
  const sql2 = `DELETE FROM productSizeAndStock WHERE productId=${req.body.productId}`
  const sql3 = `DELETE FROM products WHERE sku=${req.body.sku}`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    // console.log(result[0].num)
    if(result[0].num === 1){
      // console.log(1)
      conn.query(sql2, (err, result) => {
        if(err) return res.send(err.sqlMessage)

        conn.query(sql3, (err, result) => {
          if(err) return res.send(err.sqlMessage)

          res.send(result)
        })
      })
    }else {
      // console.log(2)
      conn.query(sql2, (err, result) => {
        if(err) return res.send(err.sqlMessage);

        res.send(result)
      })
    }
  })
})


// --------GET POPULAR PRODUCT----//
router.get("/product/popular", (req, res) => {
  const sql = `SELECT * FROM productPopulerView LIMIT 2`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result);
  })
})

// -----------ADD WAITING LIST--------//
router.put("/waiting", (req, res) => {
  const sql = `INSERT INTO waitingList SET ?`
  const data = req.body

  conn.query(sql, data, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result);
  })
});

// -----------GET WAITING LIST----------//
router.get("/waiting/get", (req, res) => {
  const sql = `SELECT * FROM waitingListView WHERE userId=${req.query.userId}`

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// ----------DELETE WAITING----------//
router.delete("/waiting", (req, res) => {
  const sql = `DELETE FROM waitingList WHERE id = ${req.body.id}`;

  conn.query(sql, (err, result) => {
    if(err) return res.send(err.sqlMessage);

    res.send(result)
  })
})
module.exports = router;
