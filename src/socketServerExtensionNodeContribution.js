const ExtensionNodeContribution = require('rodix_api').ExtensionNodeContribution;
// const http = require('http');
const {setupServer} = require('./server/server');

class socketServerExtensionNodeContribution extends ExtensionNodeContribution {
    constructor(rodiAPI, dataModel){
        super();
        this.rodiAPI = rodiAPI;
        this.dataModel = dataModel;
        this.uiHandler = rodiAPI.getUIHandler();
        this.components = this.uiHandler.getAllUIComponents();


        this.uiHandler.on('btnRunServer', this.onBtnRunServer.bind(this));
        this.uiHandler.on('btnStopServer', this.onBtnStopServer.bind(this));
        this.uiHandler.on('inputPort', this.onInputPort.bind(this));

        this.port = this.components.inputPort.getText();
        this.server = null;

        // dev
        setupServer(this.port);
    }

    validateInputPort (port) {
        if (!isNaN(port) && port > 0 && port <= 65535) {
            return;
        } 

        throw {msg: 'Invalid port', code: 'ERR_001'};
    }

    onInputPort (type, data) {
        if(type === 'change') {
            this.port = data.value;
        }
    }

    onBtnRunServer (type) {
        if(type === 'click') {
            try {
                console.debug('test')

                this.validateInputPort(this.port);

                this.server = setupServer(this.port);
                this.components.btnRunServer.setVisible(false);
                this.components.btnStopServer.setVisible(true);
                this.components.labelServerStatus.setText('Running on 127.0.0.1:' + this.port);
                console.debug('test2')
                console.debug('test2')
                
                
                this.uiHandler.render(); 

            } catch (err) {
                console.debug(err);
                if(err.msg) {
                    this.rodiAPI.getUserInteraction().MessageBox
                        .show('Warning', err.msg, 'WARNING', 'OK');
                } else {
                    this.rodiAPI.getUserInteraction().MessageBox
                        .show('Warning', 'Something went wrong', 'WARNING', 'OK');
                }
            }
            
        }
    }

    openView(){
        console.debug('bububu')
        
    }
    closeView(){
        console.debug('aaa')

    }
    generateScript(enterWriter, exitWriter){

    }

    onBtnStopServer () {
        if(this.server) {

            this.server.close(function () {
                console.debug('server closed')
            });
            this.server = null;
            this.components.btnRunServer.setVisible(true);
            this.components.btnStopServer.setVisible(false);
            this.components.labelServerStatus.setText('Not running');
            this.uiHandler.render();
        }
    }
}


module.exports = socketServerExtensionNodeContribution;
