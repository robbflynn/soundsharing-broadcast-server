var sys = require('sys');
var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;

ConnectionsManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("CONNECTIONS_MANAGER");
	this.context = context;
	
	var _self = this;
	
	this.watchers = new ObjectRegister();
	this.connectionsToWatch = new ObjectRegister();
	
	this.addAction("WATCH_FOR_DISCONNECT", function(client, message) {
		_self.executeWatchForDisconnect(client, message);
	});
};

ConnectionsManager.prototype = new ServerEventDispatcher();
ConnectionsManager.prototype.executeWatchForDisconnect = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	var targets = body && body.targets ? body.targets : null;
	
	sys.log("1.BroadcastServer[executeWatchForDisconnect]: " + targets);
	
	if (sender)
	{
		if (targets && targets.length > 0)
		{
			var sessionId;
			var targetClient;
			var report = {};
			var listener = true;
			
			for (var i = 0;i < targets.length;i ++)
			{
				sessionId = targets[i];
				targetClient = this.context.socket.server.getClientBySessionId(sessionId);
				
				report[sessionId] = targetClient ? true : false;
				
				sys.log("2.BroadcastServer[executeWatchForDisconnect]["+sessionId+"]: " + targetClient + ":" + report[sessionId]);
				
				if (targetClient)
				{
					var path1 = sender.concat([sessionId]);
					var path2 = [sessionId].concat(sender);
					
					var watchers1 = this.watchers.read(path1);
					var watchers2 = this.connectionsToWatch.read(path2);
					
					if (!watchers1)
					{
						watchers1 = new Array();
						this.watchers.register(path1, watchers1);
					}
						
					watchers1.push(listener);
					
					if (!watchers2)
					{
						watchers2 = new Array();
						this.connectionsToWatch.register(path2, watchers2);
					}
						
					watchers2.push(listener);
				}
			}
				
			this.dispatchSocketEvent({
				event: {
					type: "WATCH_FOR_DISCONNECT_COMPLETE",
					data: {
						report: report
					}
				}, 
				receiver: sender
			});
			
			sys.log("3.BroadcastServer[executeWatchForDisconnect]: " + sys.inspect(report));
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "WATCH_FOR_DISCONNECT_ERROR",
					data: {
						error: "Invalid targets!",
						code: 200
					}
				}, 
				receiver: sender
			});
	}
};

//************************************************************************************************************************
//	WATCH LOGIN
//************************************************************************************************************************

ConnectionsManager.prototype.watchDisconnected = function(sessionId)
{
	var stationMap = this.connectionsToWatch.buildObjectsMap([sessionId], [sessionId]);
	var receivers = new Array();
	
	if (stationMap && stationMap.length > 0)
		for (var i = 0;i < stationMap.length;i ++)
		{
			for (var k = 0;k < stationMap[i].obj.length;k ++)
				receivers.push(stationMap[i].route);
			
			var path1 = stationMap[i].route.concat([sessionId]);
			var path2 = [sessionId].concat(stationMap[i].route);
			
			this.watchers.unregister(path1);
			this.connectionsToWatch.unregister(path2);
		}
	
	sys.log("ConnectionsManager[watchDisconnected]: " + sessionId + " : " + receivers);
	
	if (receivers.length > 0)
		this.dispatchSocketEvent({
			event: {
				type: "DISCONNECT_DETECTED", 
				data: {
					sessionId: sessionId
				}
			}, 
			receivers: receivers
		});
};

//************************************************************************************************************************
//STOP WATCH
//************************************************************************************************************************

ConnectionsManager.prototype.disconnected = function(client)
{
	sys.log("1.ConnectionsManager[disconnected]");
	
	ServerEventDispatcher.prototype.disconnected.call(this, client);
	
	this.watchDisconnected(client.sessionId);
	
	this.watchers.remove(client.data.route);
	this.connectionsToWatch.removeByPattern(["*"].concat(client.data.route));
};
