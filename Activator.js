const path = require('path');
const PluginActivator = require('rodix_api').PluginActivator;
const socketServerDaemonService = require(path.join(__dirname, 'socketServerDaemonService'));
const socketServerExtensionService = require(path.join(__dirname, 'socketServerExtensionNodeService'));
const socketServerProgramNodeService = require(path.join(__dirname, 'socketServerProgramNodeService'));
const socketServerWidgetService = require(path.join(__dirname, 'socketServerWidgetNodeService'));

class Activator extends PluginActivator {
  constructor() {
    super();
  }

  start(context) {
    context.registerService('socketServerDaemonService', new socketServerDaemonService());
    context.registerService('socketServerExtension', new socketServerExtensionService());
    context.registerService('socketServerProgramNodeService', new socketServerProgramNodeService());
    context.registerService('socketServerWidget', new socketServerWidgetService());
  }

  stop() {
  }
}

module.exports = Activator;
