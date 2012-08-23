require('./src/utils/Math.uuid');

var config = require('./src/config/config');
var plugins = require('./src/config/plugins');

var net = require("net");
var sys = require('sys');

var flashsocket = require('flashsocket');

sys.log("flashsocket: " + flashsocket);

var BroadcastServer = require('./src/soundshare/server/BroadcastServer');
var ServerContext = require('./src/soundshare/data/ServerContext.js');

var ManagerServerClient = require('./src/soundshare/client/ManagerServerClient');

// *********

var context = new ServerContext();
context.config = config;
context.plugins = plugins;

// Socket

var socket = flashsocket.createServerBase(config.server.url);
var broadcastServer = new BroadcastServer(context);

socket.router.addUnit(broadcastServer);

context.socket = socket;
context.socket.router = socket.router;

//********************

var clients = new Array();

function createClient(manager)
{
	sys.log("--- createClient["+manager.address + ":" + manager.port+"] ---");
	
	var client = new ManagerServerClient();

	client.on("authorization_complete", function() {
		sys.log("["+manager.address + ":" + manager.port+"]authorize_complete: " + manager.serverId +":"+ manager.secureId);
	});
	client.on("authorization_error", function(err) {
		sys.log("["+manager.address + ":" + manager.port+"] **************** INVALID SERVER ADDRESS OR CREDENTIALS! **************** " + err);
	});

	client.on("preparation_complete", function(data) {
		sys.log("["+manager.address + ":" + manager.port+"]preparation_complete: " + data.address +":"+ data.port);
		
		socket.start(data.port, data.address);
	});
	client.on("preparation_error", function(e) {
		sys.log("["+manager.address + ":" + manager.port+"]**************** Error[" + e + "] **************** ");
	});

	client.on("disconnect", function() {
		sys.log("["+manager.address + ":" + manager.port+"]*** disconnect ****");
		socket.stop();
	});

	client.plugins = plugins;	
	client.address = manager.address;
	client.port = manager.port;
	client.prepare(manager.serverId, manager.secureId);
	
	clients[manager.address + ":" + manager.port] = client;
};

for (var i = 0;i < config.managers.length;i ++)
	createClient(config.managers[i]);

// ******************************************************************************************************
// crossdomain.xml
// ******************************************************************************************************

var netserver = net.createServer(function(socket){
		
	socket.addListener("error",function(err){
		socket.end && socket.end() || socket.destroy && socket.destroy();
	});

	var xml = '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM \n"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n';
	xml += '<site-control permitted-cross-domain-policies="all"/>\n';
	xml += '<allow-access-from domain="*" to-ports="*"/>\n';
	xml += '</cross-domain-policy>\n';
	
	if(socket && socket.readyState == 'open'){
	  socket.write(xml);
	  socket.end();	

	}
});

netserver.addListener("error",function(err){}); 
netserver.listen(7843, '0.0.0.0');
