const express = require('express');
const cors = require('cors')

const userRouter = require('./routers/userRouter')
app = express();
port = 8080;

app.use(express.json());
app.use(cors());
app.use(userRouter);




app.listen(port, () => {
    console.log('API Running at Port: ' + port)
})