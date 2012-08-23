var sys = require('sys');
var events = require('events');

var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var FlashSocketMessage = flashsocket.FlashSocketMessage;

var ObjectRegister = flashsocket.ObjectRegister;

var ConnectionsManager = require('./managers/connections/ConnectionsManager');
var PluginsManager = require('./managers/plugins/PluginsManager');

BroadcastServer = module.exports = function(context)
{
	ServerSocketUnit.call(this);
	
	this.setId("BROADCAST_SERVER_UNIT");
	this.context = context;
	
	this.token = null;
	
	sys.log('"[BroadcastServer(id="' + this.id + '")] ');
	
	var _self = this;
	
	// Connections Manager
	
	this.connectionsManager = new ConnectionsManager(this.context);
	this.connectionsManager.namespace = "socket.managers.ConnectionsManager";
	
	this.addUnit(this.connectionsManager);
	
	this.context.connectionsManager = this.connectionsManager;
	
	// Plugins Manager
	
	this.pluginsManager = new PluginsManager(this.context.plugins);
	this.pluginsManager.namespace = "socket.managers.PluginsManager";
	
	this.addUnit(this.pluginsManager);
	
	this.context.pluginsManager = this.pluginsManager;
	
	// *******************
	
	this.addAction("GET_MANAGERS", function(client, message) {
		_self.executeGetManagers(client, message);
	});
};

BroadcastServer.prototype = new ServerEventDispatcher();
BroadcastServer.prototype.process = function(client, message) 
{
	var header = message.getJSONHeader();
	var t = header.data ? header.data.token : null;
	
	//if (t == this.token)
		ServerEventDispatcher.prototype.process.call(this, client, message);
};

BroadcastServer.prototype.executeGetManagers = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	sys.log("-BroadcastServer[executeGetManagers]-");
	
	if (sender)
	{
		this.dispatchSocketEvent({
			event: {
				type: "GET_MANAGERS_COMPLETE",
				data: {
					managers: {
						CONNECTIONS_MANAGER_ROUTE: this.connectionsManager.route,
						PLUGINS_MANAGER_ROUTE: this.pluginsManager.route
					}
				}
			}, 
			receiver: sender
		});
	}
};