const path = require('path');
const DaemonService = require('rodix_api').DaemonService;

class socketServerDaemonService extends DaemonService{
    constructor() {
      super();

      this.executablePath = path.join(__dirname, '../static/exec', 'putty.exe');
      this.daemonContribution = null;
    }

    init(daemonContribution) {
        this.daemonContribution = daemonContribution;
        this.daemonContribution.start();
    }
    getTitle(){
        return 'socketServer';
    }
    eventOnWidget(){

    }
    getExecutable() {
      return this.executablePath;
    }
}

module.exports = socketServerDaemonService;
