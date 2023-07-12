const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
const path = require("path");
app.use(express.json());
const dbPath = path.join(__dirname,"userData.db");
let db = null;

const intializeDbandServer= async () =>{
    try{
        db = await open({
            filename : dbPath,
            driver : sqlite3.Database
        });
        app.listen(3000,()=>{
            console.log("Server Running at http://localhost:3000/");
        })
    }catch(e){
        console.log(`DB error : ${e.message}`)
        process.exit(1);
    };
};
intializeDbandServer();

// API 1 Register =====================================================================

app.post("/register",async(request,response)=>{

    let {username,name,password,gender,location} = request.body;
    let hasedPassword =await bcrypt.hash(password,12);
    let checkUser = `
    SELECT * FROM user
    WHERE username = '${username}';`;
    let dbUser =await db.get(checkUser);
    console.log(dbUser);
    if (dbUser === undefined){
        let addUserQuery = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES ( 
            '${username}',
            '${name}',
            '${hasedPassword}',
            '${gender}',
            '${location}'
        );`;
        if (password.length < 5 ){
            response.status(400);
            response.send("Password is too short");
        }else {
            let addNewUser = await db.run(addUserQuery);
            response.status(200);
            response.send("User created successfully");
        };
    }else {
        response.status(400);
        response.send("User already exists");
    };
});


// API 2 ========================================================

app.post("/login",async(request,response)=>{
    let {username,password} = request.body;
    let checkUser = `
    SELECT * FROM user
    WHERE username = '${username}';`;
    let dbUser =await db.get(checkUser);
    if (dbUser===undefined){
        response.status(400);
        response.send("Invalid user");
    }else{
        let checkPassword = await bcrypt.compare(password,dbUser.password);
        if (checkPassword===true){
            response.status(200);
            response.send("Login success!");
        }else{
            response.status(200);
            response.send("Invalid password");
        }
    };
});

// API 3 ===========================================================================

app.put("/change-password",async(request,response)=>{
    let {username,oldPassword,newPassword} = request.body;
    let checkUser = `
    SELECT * FROM user
    WHERE username = '${username}';`;
    let dbUser =await db.get(checkUser);
    if (dbUser===undefined){
        response.send("Invalid User");
        response.status(400);
    }else{
        let checkPasswordOld = bcrypt.compare(oldPassword,dbUser.password);
        if (checkPasswordOld==true){
            const newLength = newPassword.length;
            if (newLength < 5 ){
                response.status(400);
                response.send("Password is too short");
            }else{
                let newEncrypetPassword = await bcrypt.hash(newPassword,12);
                let updatePasswordQuery = `
                UPDATE user
                SET password = '${newEncrypetPassword}';`;
                let setNewPassword= await db.run(updatePasswordQuery);
                response.status(200);
                response.send("Password updated")
            }
        }else{
            response.status(400);
            response.send("Invalid current password");
        }
    }
});

module.exports = app;
