const path = require('path');
const ProgramNodeService = require('rodix_api').ProgramNodeService;
const socketServerProgramNodeContribution = require(path.join(__dirname, 'socketServerProgramNodeContribution'));

class socketServerProgramNodeService extends ProgramNodeService{
    constructor(){
        super();
    }

    getIcon() {
        return path.join(__dirname, "../static/htmlStore/resource/ico-rodi-x.png");
    }

    getTitle(){
        return 'socketServer';
    }

    getHTML(){
        return path.join(__dirname, "../static/htmlStore/socketServerProgramNode.html");
    }

    isDeprecated(){
        return false;
    }

    isChildrenAllowed(){
        return false;
    }
    isThreadAllowed(){
        return false;
    }

    createContribution(rodiAPI, dataModel){
        return new socketServerProgramNodeContribution(rodiAPI, dataModel);
    }

}

module.exports = socketServerProgramNodeService;
