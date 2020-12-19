/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Action Window
------------------------------------------

Progress bar and activity log during task completion
*/
class Action {

    constructor() {

        var self = this;
        this.blessed = require('blessed');

        this.contentContainer = this.blessed.box({
            left:0,
            right: 0,
            top: 0,
            bottom: 0,
            hidden: true,
        });

        this.activityLog = true;
        this.proceedButtonText = 'Summary';
    }
}
module.exports = Action;