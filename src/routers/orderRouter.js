const router = require("express").Router();
const conn = require("../connection/connection");

//----------GET ITMES FOR CHECKOUT-----------//
router.get("/checkout", (req, res) => {
  const sql = `SELECT * FROM checkoutItemView WHERE userId = ${
    req.query.userId
  }`;
  const sql2 = `SELECT SUM(total) subTotal FROM checkoutItemView GROUP BY userId HAVING userId = ${
    req.query.userId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    conn.query(sql2, (err2, result2) => {
      if (err2) return res.status(400).send("err2: " + err2.sqlMessage);

      res.send([result, result2]);
    });
  });
});

//--------------GET ALL SHIPPING METHOD------------//
router.get('/shipper', (req, res) => {
  const sql = `SELECT * FROM shippers`

  conn.query(sql, (err, result) => {
    if(err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/shipping", (req, res) => {
    const sql = `SELECT * FROM shippingView`;

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.send(result);
    });
});



module.exports = router;
