ServerContext = module.exports = function()
{
	this.socket = null;
	this.router = null;
	
	this.token = null;
	this.serverData = null;
	
	this.plugins = null;
};