const path = require('path');
const WidgetNodeService = require('rodix_api').WidgetNodeService;
const socketServerWidgetNodeContribution = require(path.join(__dirname, 'socketServerWidgetNodeContribution'));

class socketServerWidgetNodeService extends WidgetNodeService{
    constructor(){
        super();
    }

    getTitle(){
        return 'socketServer';
    }
    getIcon(){
        return path.join(__dirname, "htmlStore/resource/ico-rodi-x.png");
    }
    getHTML(){
        return path.join(__dirname, "htmlStore/socketServerWidgetNode.html");
    }
    createContribution(rodiAPI, dataModel){
        return new socketServerWidgetNodeContribution(rodiAPI, dataModel);
    }
}

module.exports = socketServerWidgetNodeService;
