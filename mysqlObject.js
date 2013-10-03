var mysql  = require('mysql2'),  
	util  = require('util');

var mysqlObject = function(){
	"use strict";
	this.errorHandler = "";
	this.cache = "MEMCACHE";  //MEMCACHE or OBJECT
	this.memcache = false;
	this.instance = false;
	this.constantes = false;
	this.Request = false;
	this.queryTotal = false;
	this.port = "3306";
	this.connected = false;
	this.ResultQuery = false;
	
	
	//cache object
	this.result = new Object;
	
	if (typeof(mysqlObject.initialized) === "undefined") {
		console.log("constructeur mysqlObject");
		
		//connect
		mysqlObject.prototype.connect = function(constantes, cache) {
		
			if (typeof cache === "string") this.cache = cache;
			
			if (constantes && typeof(constantes) === "object" && constantes['DB_HOST'] && constantes['DB_USER'] && constantes['DB_PASSWORD']) { 
			
				mysqlObject.constantes = constantes;
				var mere = this;
				
				if (constantes['DB_PORT']) this.port = constantes['DB_PORT'];
				//console.log(mysql);
				
				//prepare connection
				mysqlObject.instance = mysql.createConnection(
				{
					host:constantes['DB_HOST'],
					user: constantes['DB_USER'],
					password: constantes['DB_PASSWORD'],
					database: constantes['DB_DATABASE'],
					port : this.port,
					charset : 'UTF8_GENERAL_CI',
				});
				
				//connection launch !
				mysqlObject.instance.connect(function(err) { if (!err) { mysqlObject.connected = true; } });
								
				mysqlObject.instance.on('Error', function(err) {
					if (err && mere.errorHandler) {
						console.log("test error");
						//add method errorHandler for catching
						//util.log(' '+err);
						mysqlObject.connected = false;
					}
				});
				
				
			}
			return false;
		}
		
		//addFields
		mysqlObject.prototype.addFields = function(fields) {
			
			if (fields && typeof(fields) == "string") {
				mysqlObject.Request['fields'].push(fields);
			}
			return false;
		}
		
		//addFrom
		mysqlObject.prototype.addFrom = function(from) {
			if (from && typeof(from) == "string") {
				mysqlObject.Request['froms'].push(from);			
			}
			return false;
		}
		
		//addLeftJoin
		mysqlObject.prototype.addLeftJoin = function(arg1, arg2) {
			if (arg1 && arg2 && typeof(arg1) === "string" && typeof(arg2) === "string" ) {
				var table = arg1.split(".");
				if (typeof(table[0]) === "string") {
					mysqlObject.Request['leftJoins'].push(util.format("LEFT JOIN %s ON %s = %s", table, arg1, arg2));
				}
			}
			return false;
		}
		
		//addWhere
		mysqlObject.prototype.addWhere = function(arg1, arg2) {
			if (typeof arg1 === "string") {
				if (!arg2) arg2 = "AND"
				mysqlObject.Request['wheres'].push(util.format("%s %s", arg2,arg1));			
			}
		
		}
		
		
		mysqlObject.prototype.query = function(arg1, callback, active, multi, cache) {
			var startRequest = false;
			var mere = this;
			if (!arg1 && typeof this.Request === "object") {
				
				if (typeof this.Request['fields'] === 'object') {
					var fields = Request['fields'].join(",");
					var froms = Request['froms'].join(",");
					var leftjoins = Request['leftJoins'].join(" ");
					var wheres = Request['wheres'].join(" ");
					
					this.queryToTal = util.format(" %s %s %s %s ", fields, froms, leftjoins, wheres); 

					if (typeof active === "Boolean" && active === true) {
					
						startRequest = true;
					}
					
				}
			}		
			else if (typeof arg1 === "string") {
				this.queryTotal = arg1;
				startRequest = true;
			}
			
			if (startRequest == true) {
				var foundinCache = false;
				if (cache && typeof cache === "string") {
					switch(cache) {
						case "MEMCACHE":
							if (typeof this.memcache === "object") {
								//convert in Base64
								
								var keyRequest = new Buffer(this.queryTotal).toString('base64');
								
								this.memcache.connect(function() {
									mysqlObject.memcache.get( keyRequest,  function(err, response) {
										if (!err) { 
											if (typeof callback === "Function") {
												if (response[keyRequest]) {
													var jsonResult = false;
													try {
														jsonResult = JSON.parse(response[keyRequest]);
														
														if (typeof jsonResult === "object") {
															reponse[keyRequest] = jsonResult;
														}
 													}
													catch(err) { err = true;}
													
													callback(err, response[keyRequest]);
												}
											}
											else {
												mere.ResultQuery = response[keyRequest];
											}
										}
										else {
											//no cache in memcache
											
										}
									});
									
									
									
								});
								
								
							}							
						break;
						//other cache here... REDIS, APC...
						
					}
				
				}
				if (false === foundinCache) {
					mysqlObject.instance.query(this.queryTotal, function(err, rows) {
						if (!err) {
						
							if (cache) {
								switch(cache) {
									case "MEMCACHE":
										if (typeof mysqlObject.memcache === "object") {
											//convert key base64
											var keyRequest = new Buffer(mysqlObject.queryTotal).toString('base64');
											
											if (typeof keyRequest === "string") {
												if (typeof rows !== "string") {
													var rows_convert = JSON.stringify(rows);
												}
												mysqlObject.memcache.set(keyRequest, rows, { flags: 0, exptime: 0}, function(err, status) {
														if (!err) {
														
														}
														else {
														
														}
													
													});
											}
										}
									break;
								}	
							}
							if (typeof callback === "Function") {
								if (rows) {
									callback(err, rows);
								}
							}
							else {
								mere.ResultQuery = rows;
							}
						}
						else if (err) {
							if (typeof callback === "Function") {
								callback(false);
							}
							else {
								mere.ResultQuery = false;
								//display error ?
							}
						}
						
					});
				}
			
			}

			
		}
		
		mysqlObject.prototype.execute = function(callback, active, multi, cache) {
			
			if (!active) active = true; if (!multi) multi = true; if (!cache) cache = false;
			
			mysqlObjet.instance.query(undefined, callback);
			
			
			
		}
		
		mysqlObject.prototype.reset = function() {
			
			this.Request = false;
			
		}
	}
		
	mysqlObject.initialized = true;
}

module.exports = mysqlObject;



