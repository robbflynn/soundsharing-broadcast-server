var sys = require('sys');
var http = require('http');
var flashsocket = require('flashsocket');

var ClientEventDispatcher = flashsocket.ClientEventDispatcher;
var ObjectRegister = flashsocket.ObjectRegister;

var ServersManager = require("./managers/servers/ServersManager");

ManagerServerClient = module.exports = function()
{
	ClientEventDispatcher.call(this);
	
	var _self = this;
	
	this.address = null;
	this.port = null;
	
	this.serverId = null;
	this.secureId = null;
	
	this.client = new flashsocket.FlashSocketClient();
	this.router = new flashsocket.ClientMessageRouter(this.client);
	this.router.addUnit(this);
	
	this.identifiedFn = null;
	
	this.serverData = null;
	this.plugins = [];
	
	this.serversManager = new ServersManager();
	this.serversManager.receiverNamespace = "socket.managers.ServersManager";
	
	this.addUnit(this.serversManager);
	
	
	this.client.on("connect", function() { 
		_self.router.connected();
		
		_self.emit("connect");
	});
	
	this.client.on("disconnect", function() { 
		_self.router.disconnected(); 
		_self.emit("disconnect");
		
		if (_self.reconnectEnabled)
			_self.reconnect();
	});
	
	this.client.on("error", function() { 
		_self.emit("error");
		
		if (_self.reconnectEnabled)
			_self.reconnect();
	});
	
	this.client.on("message", function(message) { 
		_self.router.process(message);
	});
	
	this.reconnectEnabled = true;
	this.reconnectInterval = null;
};

ManagerServerClient.prototype = new ClientEventDispatcher();
ManagerServerClient.prototype.prepare = function(serverId, secureId)
{
	sys.log("prepare: " + this.address +":"+ this.port);
	
	this.serverId = serverId ? serverId : this.serverId;
	this.secureId = secureId ? secureId : this.secureId;
	
	var _self = this;
	var client = http.createClient(this.port, this.address);
	client.on('error', function(err) { 
		_self.emit("authorization_error", err);
		
		if (_self.reconnectEnabled)
			_self.reconnect();
	});
	
	var request = client.request('GET', '/servers/authorize/' + this.serverId + "/" + this.secureId);
	request.on('response', function(response) {
		
		var data = "";
		response.on('data', function(chunk) {
			data += chunk;
		});
		response.on('end', function() {
			try
			{
				var obj = JSON.parse(data);
				
				sys.log("1. ---- authorization_complete ----!! " + data + " : " + obj.error);
				
				if (obj.error)
				{
					_self.emit("authorization_error", obj.error, obj.code);
					_self.reconnect();
				}
				else
				{
					_self.serverData = obj.data;
					_self.emit("authorization_complete");
					
					_self.connect(obj.settings.socket.address, obj.settings.socket.port);
				}
			}
			catch(err) {
				_self.emit("authorization_error", err);
			}
		});
	});

	request.end();
};

ManagerServerClient.prototype.connect = function(address, port)
{
	sys.log("-connect- " + this.identifiedFn);
	
	if (this.reconnectInterval)
		clearTimeout(this.reconnectInterval);
	
	var _self = this;
	
	if (this.identifiedFn)
		this.router.removeListener("identified", this.identifiedFn);
	
	this.identifiedFn = function(data) {
		
		sys.log("---------- IDENTIFIED ---------");
		
		_self.setId(data.sessionId);
		_self.router.remoteRegisterRoutingMap();
		
		_self.serverUp();
		
		_self.router.removeListener("identified", _self.identifiedFn);
		_self.identifiedFn = null;
	};
	
	this.router.on("identified", this.identifiedFn);
	
	this.client.connect(address, port);
};

ManagerServerClient.prototype.serverUp = function()
{
	this.serversManager.token = this.serverData.token;
	
	var completeFn;
	var errorFn;
	
	var _self = this;
	
	completeFn = function() {
		_self.serversManager.removeSocketEventListener("SERVER_UP_COMPLETE", completeFn);
		_self.serversManager.removeSocketEventListener("SERVER_UP_ERROR", errorFn);
		
		_self.emit("preparation_complete", _self.serverData);
	};
	
	errorFn = function() {
		_self.serversManager.removeSocketEventListener("SERVER_UP_COMPLETE", completeFn);
		_self.serversManager.removeSocketEventListener("SERVER_UP_ERROR", errorFn);
		
		_self.emit("preparation_error");
	};
	
	this.serversManager.addSocketEventListener("SERVER_UP_COMPLETE", completeFn);
	this.serversManager.addSocketEventListener("SERVER_UP_ERROR", errorFn);
	
	this.serversManager.serverUp(this.serverData.token, this.plugins);
};

ManagerServerClient.prototype.reconnect = function()
{
	var _self = this;
	
	if (this.reconnectInterval)
		clearTimeout(this.reconnectInterval);
	
	this.reconnectInterval = setTimeout(function() {
		_self.reconnectInterval = null;
		_self.prepare();
	}, 5000);
};