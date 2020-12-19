/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Analysis Window
------------------------------------------

Progress bar and activity log during analysis
*/
class AnalyseWindow {

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
        this.proceedButtonText = 'Review';
    }
}
module.exports = AnalyseWindow;