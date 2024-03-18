const express = require("express");
const ejs = require("ejs");
const path = require('path');
const expresslayouts  = require('express-ejs-layouts');
const fileupload = require("express-fileupload");
const MongoClient = require('mongodb').MongoClient;

const app = express();

app.set("views",path.join(__dirname,"/views/"));
app.set("view engine","ejs");
app.set("layout","layouts/mainlayouts")
app.use(expresslayouts);
app.use(fileupload());
app.use(express.static(__dirname+"/public"));
app.use(express.urlencoded({extended:false}));
var url = "mongodb://127.0.0.1:27017/vehicle_workshop";
var admin_detail_collection;
var service_detail_collection;
var customer_registration_collection
MongoClient.connect(url,function(err,client){
    if(err) throw err;
    const db = client.db('vehicle_workshop');
    admin_detail_collection = db.collection('admin_detail');
    service_detail_collection = db.collection('service_detail');
    customer_registration_collection = db.collection('customer_registration');
    console.log("Database Connected Successfully");
})


app.get("/",function(req,res){
    res.render("default/home");
})

app.get("/about",function(req,res){
    res.render("default/about");
})

app.get("/contact",function(req,res){
    res.render("default/contact");
})

app.get("/registration",function(req,res){
    res.render("default/registration");
})

app.post("/add_cust",function(req,res){
    const {txtname,txtadd,txtcity,txtmno,txtemail,txtpwd}= req.body;
    customer_registration_collection.findOne({email_id: txtemail},function(err,result2){
        if(result2== null)
        {
            let custid = 0;
            customer_registration_collection.find().sort({customer_id: -1}).limit(1).toArray(function(err1,result1){
                if(err1) throw err1;
                if(result1.length == 0)            
                {
                    custid=1;
                }
                else
                {
                    var row = JSON.parse(JSON.stringify(result1[0]));
                    custid = row.customer_id + 1;
                }
                customer_registration_collection.insertOne({customer_id:custid,customer_name: txtname,address: txtadd,city: txtcity,mobile_no: txtmno,email_id: txtemail,pwd: txtpwd},function(err2,result2){
                    if(err2)
                    {
                        throw err2;
                    }
                    res.write("<script>alert('Register Successfully'); window.location.href='/login'; </script>");
                })
            })
            
        }else{
            res.write("<script>alert('Email Id Already Exists'); window.location.href='/registration'; </script>");
        }
    })
})

app.get("/login",function(req,res){
    res.render("default/login");
})

app.post("/log_user",function(req,res){
    const {txtemail,txtpwd} = req.body;
    admin_detail_collection.findOne({email_id: txtemail,pwd: txtpwd},function(err,result){
        if(err) throw err;
        if(result == null)
        {
            res.write("<script> alert('Invalid Email ID or Password'); window.location.href='/login' </script>");
        }else{
            res.write("<script> alert('Admin Login Successfully'); window.location.href='/admin_manage_service' </script>");
        }
    })
})

app.get("/logout",function(req,res){
    res.redirect("/");
})

app.get("/admin_manage_service",function(req,res){
    service_detail_collection.find().toArray(function(err,result){
        if(err) throw err;
        res.render("admin/admin_manage_service",{layout:"layouts/adminlayouts",servicedetail: result});
    })
    
})

app.post("/add_service",function(req,res){
    const {txtname,txtdesc,txtprice} = req.body;

    if(!req.files || Object.keys(req.files).length == 0)
    {
        res.write("<script> alert('Please Select Service Banner Image'); window.location.href='/admin_manage_service' </script>");        
    }else{
        let samplefile = req.files.txtimg;
        let tmp_path = "/service_img/"+Date.now()+".jpg";
        let upload_path = __dirname + "/public" + tmp_path;
        let serviceid = 0
        service_detail_collection.find().sort({service_id: -1}).limit(1).toArray(function(err1,result1){
            if(err1) throw err1;
            if(result1.length == 0)            
            {
                serviceid=1;
            }
            else
            {
                var row = JSON.parse(JSON.stringify(result1[0]));
                serviceid = row.service_id + 1;
            }
            service_detail_collection.insertOne({service_id: serviceid,service_name: txtname,description: txtdesc,price: parseInt(txtprice),service_img: tmp_path},function(err2,result2){
                if(err2) throw err2;
                samplefile.mv(upload_path,function(err3,result3){
                    if(err3)
                    {
                        res.write("<script> alert('Error in Image uploading '); window.location.href='/admin_manage_service' </script>");        
                    }else{
                        res.write("<script> alert('Service Detail Saved Succesfully'); window.location.href='/admin_manage_service' </script>");        
                    }
                })
                
            })
        })
    }
})

app.get("/delete_service/:sid",function(req,res){
    let serviceid = parseInt(req.params.sid);
    service_detail_collection.remove({service_id: serviceid},function(err,result){
        if(err) throw err;
        res.write("<script> alert('Service Detail Deleted Succesfully'); window.location.href='/admin_manage_service' </script>");                
    })
})

app.get("/edit_service/:sid",function(req,res){
    let serviceid = parseInt(req.params.sid);
    service_detail_collection.find({service_id: serviceid}).toArray(function(err,result){
        if(err) throw err;
        res.render("admin/admin_update_service",{layout:"layouts/adminlayouts",servicedetail: result});
    })
      
});

app.post("/update_service",function(req,res){
    const {txtsid,txtname,txtdesc,txtprice} = req.body;
    if(!req.files || Object.keys(req.files).length == 0)
    {
        service_detail_collection.updateOne({service_id: parseInt(txtsid)},{$set: {service_name: txtname,description: txtdesc,price: parseInt(txtprice)}},function(err1,result1){
            if(err1) throw err1;
            res.write("<script> alert('Service Detail Updated Succesfully'); window.location.href='/admin_manage_service' </script>");                            
        })
    }else{
        let samplefile = req.files.txtimg;
        let tmp_path = "/service_img/"+Date.now()+".jpg";
        let upload_path = __dirname + "/public" + tmp_path;
        service_detail_collection.updateOne({service_id: parseInt(txtsid)},{$set: {service_name: txtname,description: txtdesc,price: parseInt(txtprice),service_img: tmp_path}},function(err2,result2){
            if(err2) throw err2;
            samplefile.mv(upload_path,function(err3,result3){
                if(err3)
                {
                    res.write("<script> alert('Error In Updating'); window.location.href='/admin_manage_service' </script>");                                    
                }else{
                    res.write("<script> alert('Service Detail Updated Succesfully'); window.location.href='/admin_manage_service' </script>");                            
                }
            })
            
        })
    }

})

app.listen(3000,function(){
    console.log("Server Started At port No 3000 click here http://127.0.0.1:3000/ to open page")
})