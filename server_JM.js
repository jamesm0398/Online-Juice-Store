const express_JM = require('express');
const app_JM  = express_JM();
const path_JM  = require('path');
const mongoose_JM  = require('mongoose');
const sessions_JM = require('express-session');

const username_JM = 'jamesm98';
const password_JM = 'juice';

const {check, validationResult} = require('express-validator');
const { error } = require('console');

const Order = mongoose_JM.model('Order', {
    name: String,
    phone: String,
    numMango: Number,
    numBerrys: Number,
    numApples: Number,
    subTotal: Number,
    taxAmount: Number,
    totalCost: Number
});

var session;

app_JM.set('views',path_JM.join(__dirname,'/views'));
app_JM.set('view engine', 'ejs');

app_JM.use(express_JM.static(__dirname + '/')); 
app_JM.use(express_JM.urlencoded({extended:false}));

app_JM.use(sessions_JM({
    secret:"mysecret",
    resave: false,
    saveUninitialized: true
}));

mongoose_JM.connect('mongodb://localhost:27017/james_juice_store').then(()=> console.log('connected to database'));

app_JM.get('/', function(req,res){
    res.render('order');
});

app_JM.get('/viewOrders', async function(req,res){
    const orders = await Order.find();

    console.log("orders: " + orders);

    
    if(req.session.userLoggedIn)
    {
       
        res.render('vieworders', {orders:orders});
    }

    else
    {
        res.redirect('/login');
    }
   
});

app_JM.get('/login', function(req,res){
    res.render('login');
});

app_JM.get('/logout', function(req,res){
    req.session.destroy();
    res.render('logout');
});


app_JM.post('/loginUser', (req,res) =>{
    if(req.body.username == username_JM && req.body.password == password_JM)
    {
        session = req.session;
        session.userid = req.body.username;
        req.session.userLoggedIn = true;
        console.log(req.session);
        res.render('order', {loginSuccess:'Login successful'});
    }

    else
    {
        res.render('login', {loginFail:'Username/password incorrect'});
    }
})



app_JM.post('/processOrder', [
    check('name', 'Name cannot be empty').notEmpty(),
    check('phone', 'Phone number not entered correctly').isMobilePhone(),
    check('mangos', 'Number not entered in mango juice field').optional({checkFalsy:true}).isInt(),
    check('berrys', 'Number not entered in berry juice field').optional({checkFalsy:true}).isInt(),
    check('apples', 'Number not entered in apple juice field').optional({checkFalsy:true}).isInt()
    
], function(req,res){
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        //send any errors as an array to the front end
        console.log(errors);
        res.render('order', {
            errors:errors.array()
        });
    }

    else
    {
        let numMango = req.body.mangos;
        let numBerrys = req.body.berrys;
        let numApples = req.body.apples;

        if(numMango + numBerrys + numApples == 0)
        {
            res.render('order', {noneError:'you must enter at least one juice' });
        }

        else
        {
            if(!numMango)
            {
                numMango = 0;
            }
    
            if(!numBerrys)
            {
                numBerrys = 0;
            }
    
            if(!numApples)
            {
                numApples = 0;
            }
    
            let costMango = numMango*2.99;
            let costBerry = numBerrys*1.99;
            let costApple = numApples*2.49;
    
            let subTotal = costMango + costBerry + costApple;
    
            let name = req.body.name;
            let phone = req.body.phone;
            let taxAmount = 0;
            let taxPercent = 0.13;
            let totalAmount = 0;
    
             //calculate tax amount
             taxAmount = subTotal * taxPercent;

             taxAmount = Math.round(taxAmount * 100)/100;
            
             //calculate total amount
             totalAmount = subTotal + taxAmount;

             totalAmount = Math.round(totalAmount*100)/100;
    
             let orderData = {
                name: name,
                phone: phone,
                numMango: numMango,
                numBerrys: numBerrys,
                numApples: numApples,
                subTotal: subTotal,
                taxAmount: taxAmount,
                totalCost: totalAmount
             }
    
             let newOrder = new Order(orderData);
             newOrder.save();
    
             res.render('receipt', orderData);
    
        }

       
         
    }
});

app_JM.get('/deleteOrder/:id', async function(req,res)
{
    let orderID = req.params.id;
    await Order.findByIdAndDelete({_id:orderID});
    res.render('order_deleted');
});


app_JM.listen(4444,function(){console.log('listening on port 4444')});

