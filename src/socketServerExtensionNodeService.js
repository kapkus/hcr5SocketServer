const path = require('path');
const ExtensionNodeService = require('rodix_api').ExtensionNodeService;
const socketServerExtensionNodeContribution = require(path.join(__dirname, 'socketServerExtensionNodeContribution'));

class socketServerExtensionNodeService extends ExtensionNodeService{
    constructor(){
        super();
    }

    getTitle(){
        return 'socketServer';
    }
    getHTML(){
        return path.join(__dirname, "../static/htmlStore/socketServerExtensionNode.html");
    }
    createContribution(rodiAPI, dataModel){
        return new socketServerExtensionNodeContribution(rodiAPI, dataModel);
    }
}

module.exports = socketServerExtensionNodeService;
