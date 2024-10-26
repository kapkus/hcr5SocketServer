const WidgetNodeContribution = require('rodix_api').WidgetNodeContribution;

class socketServerWidgetNodeContribution extends WidgetNodeContribution {
    constructor(rodiAPI, dataModel){
        super();
        this.rodiAPI = rodiAPI;
        this.dataModel = dataModel;
        this.uiHandler = rodiAPI.getUIHandler();
        this.components = this.uiHandler.getAllUIComponents();
    }

    openView(){

    }
    closeView(){

    }
}


module.exports = socketServerWidgetNodeContribution;
