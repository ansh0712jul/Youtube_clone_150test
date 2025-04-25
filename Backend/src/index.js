import dotenv from "dotenv"
import app from "./app.js";
import connectDb from "./db/index.js";


dotenv.config({
    path:"./.env"
})


connectDb()
.then( () =>{
    app.listen(process.env.PORT || 8080 , () =>{
        console.log(`server is listening on port ${process.env.PORT}`);
    })
})
.catch((err) => console.log("Mogodb connection failed 😩",err));