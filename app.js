var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var qs = require('querystring');
var SquareConnect = require('square-connect');

//GA Property Variable
var gaPropertyId = process.env.gaPropertyId;
var accessToken = process.env.squareAccessToken;

//Server Details
var app = express();
var port = process.env.PORT || 3000;

//Set Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

//Square API
var square = new SquareConnect(accessToken);

//Grab transaction info from Square
app.post('/sq', function(req, res){ 
	//Grab transaction ID
	var transactionRequest = "me/payments/" + req.body.entity_id;

	//Log transaction info from Square for testing purposes
	console.log(req.body);

	//Get transaction details
	square.api(transactionRequest, function(req, res) {

		//Log transaction details for testing purposes
		console.log(JSON.stringify(res.data));

		//Get total revenue
		totalRevenue = parseFloat(Math.round(res.data.total_collected_money.amount * .01)).toFixed(2);

		//Get tax
		tax = parseFloat(res.data.additive_tax_money.amount * .01).toFixed(2);

		//Get products purchased
		var productPrice = "";
		var productVariant = "";
		var productSKU = "";
		var productName = "";
		var productCategory = "";
		var productQuantity = "";

		for (i = 0; i < res.data.itemizations.length; i++) { 
	    	itemAmount = parseFloat(res.data.itemizations[i].total_money.amount * .01).toFixed(2);
	    	itemVariation  = res.data.itemizations[i].item_variation_name;
	    	itemSku = res.data.itemizations[i].item_detail.sku;
	    	itemName = res.data.itemizations[i].name;
	    	itemCategory = res.data.itemizations[i].item_detail.category_name;
	    	itemQuantity = Math.round(res.data.itemizations[i].quantity);

	    	if (itemVariation != null) {
		    	productPrice +=  "&pr" + [i+1] + "pr=" + itemAmount;
		    	productVariant +=  "&pr" + [i+1] + "va=" + itemVariation;
		    	productSKU +=  "&pr" + [i+1] + "id=" + itemSku;
		    	productName +=  "&pr" + [i+1] + "nm=" + itemName;
		    	productCategory +=  "&pr" + [i+1] + "ca=" + itemCategory;
		    	productQuantity +=  "&pr" + [i+1] + "qt=" + itemQuantity;
	    	} else {
	    		productPrice +=  "&pr" + [i+1] + "pr=" + itemAmount;
		    	productVariant +=  "&pr" + [i+1] + "va=None";
		    	productSKU +=  "&pr" + [i+1] + "id=None";
		    	productName +=  "&pr" + [i+1] + "nm=" + itemName;
		    	productCategory +=  "&pr" + [i+1] + "ca=Cash";
		    	productQuantity +=  "&pr" + [i+1] + "qt=" + itemQuantity;
	    	}
		};
		
		//Structure data and send GA hit
		var data = {
			ec: "Purchase",
			ea: "Transaction",
			el: res.data.id,
			t: "event",
			uid: res.data.creator_id,
			tid: gaPropertyId,
			tr: totalRevenue,
			pa: "purchase", 
			tt: tax,
			ti: res.data.id,
			cu: res.data.total_collected_money.currency_code,
			cd9: res.data.tender[0].name,
			cd10: res.data.created_at,
			cd11: res.data.creator_id
		}; 
		console.log("https://www.google-analytics.com/collect?v=1&" + qs.stringify(data) + productPrice + productVariant + productSKU + productName + productCategory + productQuantity); 
		request.post("https://www.google-analytics.com/collect?v=1&" + qs.stringify(data) + productPrice + productVariant + productSKU + productName + productCategory + productQuantity,
			function(error, resp, body){
			console.log(error);
			})
	});
	res.send("OK")
});

//Start Server
app.listen(port, function () {
	console.log('Listening on port ' + port); 
});
