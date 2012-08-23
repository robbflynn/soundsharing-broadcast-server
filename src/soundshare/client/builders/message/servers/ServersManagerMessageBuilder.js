var sys = require('sys');
var flashsocket = require('flashsocket');

ServersManagerMessageBuilder = module.exports = function(target)
{
	this.target = target;
	
	this.message = new flashsocket.FlashSocketMessage();
	this.messageHeader = {
		route: {
			sender: null,
			receiver: null
		},
		data: {
			action: {
				xtype: null
			}
		}
	};
};

ServersManagerMessageBuilder.prototype.build = function(xtype)
{
	if (!xtype)
		throw new Error("invalid action xtype!");
	
	sys.log("ServersManagerMessageBuilder[build]: " + xtype + " : " + this.target.token + " : " + this.target.receiverRoute);
	
	this.messageHeader.route.sender = this.target.route;
	this.messageHeader.route.receiver = this.target.receiverRoute;
	
	this.messageHeader.data.token = this.target.token;
	this.messageHeader.data.action.xtype = xtype;
	
	this.message.clear();
	this.message.setJSONHeader(this.messageHeader);
	
	return this.message;
};

ServersManagerMessageBuilder.prototype.buildServerUpMessage = function(token, plugins)
{
	var message = this.build("SERVER_UP");
	message.setJSONBody({
		token: token,
		plugins: plugins
	});
	
	return message;
};