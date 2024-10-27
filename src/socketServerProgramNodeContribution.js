const ProgramNodeContribution = require('rodix_api').ProgramNodeContribution;

class socketServerProgramNodeContribution extends ProgramNodeContribution {
    constructor(rodiAPI, dataModel){
        super();
        this.rodiAPI = rodiAPI;
        this.dataModel = dataModel;
        this.uiHandler = rodiAPI.getUIHandler();
        this.components = this.uiHandler.getAllUIComponents();
    }
    initializeNode(thisNode, callback) {
        callback(null, thisNode);
    }
    openView(){

    }
    closeView(){

    }
    generateScript(enterWriter, exitWriter){

    }
    isDefined(){
        return true;
    }
}

module.exports = socketServerProgramNodeContribution;